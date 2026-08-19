import { fishAudioPreview } from "@poststreak/integrations/fish-audio";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Voice Generation Orchestration
// generate.preview: synchronous, short (~30s), direct Fish Audio call
// generate.full: async via job queue, debits wallet on confirmed success
// ============================================================================

export type VoicePreviewResult = {
  success: boolean;
  audioBlob?: Blob;
  error?: string;
};

export type VoiceFullRenderResult = {
  success: boolean;
  jobId?: string;
  error?: string;
};

/**
 * Generate a short voice preview (synchronous).
 * Cheap enough not to need the queue.
 */
export async function generatePreview(params: {
  supabase: SupabaseClient;
  userId: string;
  projectId: string;
}): Promise<VoicePreviewResult> {
  const { supabase, userId, projectId } = params;

  // Fetch project + voice
  const { data: project, error: fetchErr } = await supabase
    .from("voice_projects")
    .select("script, voice:series_voices(fish_audio_voice_id)")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (fetchErr || !project) {
    return { success: false, error: "Project not found" };
  }

  // Supabase's nested embed shape (object vs. array) depends on FK
  // direction and isn't statically known without generated DB types —
  // handle both rather than assert one and risk a runtime mismatch.
  const voiceEmbed = project.voice as
    | { fish_audio_voice_id: string }
    | { fish_audio_voice_id: string }[]
    | null;
  const voice = Array.isArray(voiceEmbed) ? (voiceEmbed[0] ?? null) : voiceEmbed;
  if (!voice) {
    return { success: false, error: "No voice selected" };
  }

  try {
    const audioBlob = await fishAudioPreview({
      text: project.script,
      voiceId: voice.fish_audio_voice_id,
    });

    return { success: true, audioBlob };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Preview generation failed",
    };
  }
}

/**
 * Enqueue a full voice render (async).
 * Debits voice_minutes_ledger only on confirmed successful render.
 */
export async function enqueueFullRender(params: {
  supabase: SupabaseClient;
  userId: string;
  projectId: string;
}): Promise<VoiceFullRenderResult> {
  const { supabase, userId, projectId } = params;

  // Fetch project + voice
  const { data: project, error: fetchErr } = await supabase
    .from("voice_projects")
    .select("script, voice:series_voices(fish_audio_voice_id)")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (fetchErr || !project) {
    return { success: false, error: "Project not found" };
  }

  // Supabase's nested embed shape (object vs. array) depends on FK
  // direction and isn't statically known without generated DB types —
  // handle both rather than assert one and risk a runtime mismatch.
  const voiceEmbed = project.voice as
    | { fish_audio_voice_id: string }
    | { fish_audio_voice_id: string }[]
    | null;
  const voice = Array.isArray(voiceEmbed) ? (voiceEmbed[0] ?? null) : voiceEmbed;
  if (!voice) {
    return { success: false, error: "No voice selected" };
  }

  // Check wallet balance
  const { data: wallet } = await supabase
    .from("voice_minutes_wallet")
    .select("included_minutes, used_minutes")
    .eq("user_id", userId)
    .gt("period_end", new Date().toISOString())
    .limit(1)
    .single();

  if (wallet) {
    const remaining = wallet.included_minutes - wallet.used_minutes;
    if (remaining <= 0) {
      return {
        success: false,
        error: "No voice minutes remaining",
      };
    }
  }

  // Estimate minutes from script length (~150 words per minute)
  const wordCount = project.script.split(/\s+/).length;
  const estimatedMinutes = Math.ceil(wordCount / 150);

  // Mark project as generating
  await supabase
    .from("voice_projects")
    .update({ status: "generating" })
    .eq("id", projectId);

  // Enqueue the job via the job queue
  // The actual rendering happens in packages/jobs/index.ts
  // We write a job event that the polling worker picks up
  await supabase.from("analytics_events").insert({
    user_id: userId,
    event_name: "jobqueued",
    properties: {
      type: "voice_full_render",
      project_id: projectId,
      voice_id: voice.fish_audio_voice_id,
      script: project.script,
      estimated_minutes: estimatedMinutes,
    },
  });

  // Track analytics
  await supabase.from("analytics_events").insert({
    user_id: userId,
    event_name: "voice_render_enqueued",
    properties: {
      project_id: projectId,
      estimated_minutes: estimatedMinutes,
    },
  });

  return {
    success: true,
    jobId: projectId, // Using projectId as job reference
  };
}

/**
 * Complete a full render (called by the job worker after Fish Audio responds).
 * Debits the wallet and updates project status.
 */
export async function completeRender(params: {
  supabase: SupabaseClient;
  projectId: string;
  userId: string;
  audioUrl: string;
  durationMinutes: number;
}): Promise<{ success: boolean; error?: string }> {
  const { supabase, projectId, userId, audioUrl, durationMinutes } = params;

  // Debit the wallet
  const { error: debitErr } = await supabase
    .from("voice_minutes_ledger")
    .insert({
      user_id: userId,
      type: "debit",
      minutes: durationMinutes,
      source: "generation",
    });

  if (debitErr) {
    return { success: false, error: "Failed to debit wallet" };
  }

  // No wallet.used_minutes update here on purpose — the voice_minutes_wallet
  // migration's own doc comment is explicit that balance is derived from
  // voice_minutes_ledger, never mutated directly. The debit insert above is
  // the whole operation; a denormalized used_minutes column would just be a
  // second source of truth that can drift from the ledger.

  // Update project status
  const { error: updateErr } = await supabase
    .from("voice_projects")
    .update({
      status: "ready",
      media_urls: [audioUrl],
    })
    .eq("id", projectId);

  if (updateErr) {
    return { success: false, error: "Failed to update project" };
  }

  // Track analytics
  await supabase.from("analytics_events").insert({
    user_id: userId,
    event_name: "voice_render_completed",
    properties: {
      project_id: projectId,
      duration_minutes: durationMinutes,
    },
  });

  return { success: true };
}

import { groqChat } from "@poststreak/integrations/groq";
import { moderationFlagPrompt } from "./prompts";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// AI-assisted moderation flagging
// Flags content for the staff review queue. Never auto-enforces.
// ============================================================================

export type ModerationResult = {
  flagged: boolean;
  categories: string[];
  severity: "low" | "medium" | "high";
  confidence: number;
  reason: string;
};

/**
 * Analyze content for safety issues.
 * Returns a flag score — a human moderator makes the final decision.
 */
export async function flagContent(params: {
  supabase: SupabaseClient;
  contentType: "message" | "profile" | "discovery";
  content: string;
  contentOwnerId: string;
  reporterId?: string;
}): Promise<ModerationResult> {
  const { supabase, contentType, content, contentOwnerId, reporterId } = params;

  // Skip empty or very short content
  if (!content || content.length < 5) {
    return {
      flagged: false,
      categories: [],
      severity: "low",
      confidence: 0,
      reason: "Content too short to analyze",
    };
  }

  try {
    const prompt = moderationFlagPrompt({ contentType, content });

    const response = await groqChat({
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      temperature: prompt.temperature,
      max_tokens: 256,
    });

    // Parse the response
    const cleaned = response
      .replace(/^```json\n?/i, "")
      .replace(/^```\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    const result = JSON.parse(cleaned) as ModerationResult;

    // If flagged, create a report in the moderation queue
    if (result.flagged && result.confidence >= 0.5) {
      const categoryMap: Record<string, string> = {
        harassment: "harassment",
        spam: "spam",
        explicit: "inappropriate",
        hate_speech: "harassment",
        misinformation: "other",
        personal_info: "other",
      };

      const reportCategory =
        categoryMap[result.categories[0] ?? ""] ?? "other";

      await supabase.from("reports").insert({
        reporter_id: reporterId ?? contentOwnerId,
        target_user_id: contentType === "profile" ? contentOwnerId : null,
        target_message_id: contentType === "message" ? contentOwnerId : null,
        target_type: contentType === "message" ? "message" : "user",
        category: reportCategory,
        evidence: `AI-flagged: ${result.categories.join(", ")}. ${result.reason}`,
        severity: result.severity,
        status: "pending",
      });

      // Track analytics
      await supabase.from("analytics_events").insert({
        user_id: contentOwnerId,
        event_name: "content_flagged",
        properties: {
          content_type: contentType,
          categories: result.categories,
          severity: result.severity,
          confidence: result.confidence,
        },
      });
    }

    return result;
  } catch {
    // AI failure — don't flag, let human moderation handle it
    return {
      flagged: false,
      categories: [],
      severity: "low",
      confidence: 0,
      reason: "Analysis failed — deferred to human moderation",
    };
  }
}

/**
 * Batch-analyze multiple messages in a conversation.
 * Returns flagged messages for review.
 */
export async function flagConversation(params: {
  supabase: SupabaseClient;
  messages: Array<{ id: string; content: string; sender_id: string }>;
  conversationOwnerId: string;
}): Promise<Array<{ messageId: string; result: ModerationResult }>> {
  const results: Array<{ messageId: string; result: ModerationResult }> = [];

  for (const message of params.messages) {
    const result = await flagContent({
      supabase: params.supabase,
      contentType: "message",
      content: message.content,
      contentOwnerId: message.sender_id,
      reporterId: params.conversationOwnerId,
    });

    if (result.flagged) {
      results.push({ messageId: message.id, result });
    }
  }

  return results;
}

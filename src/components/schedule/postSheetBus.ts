// Any page can open one of the creator's posts (Schedule, the calendar, Home, the bell…). The sheet
// itself is mounted once, in App.tsx, which registers how to open it here.

let opener: ((postId: string | null) => void) | null = null;

export function setPostOpener(fn: ((postId: string | null) => void) | null): void {
  opener = fn;
}

/** Opens the post's sheet: its words, its time, where it stands on each platform. */
export function openPost(postId: string): void {
  opener?.(postId);
}

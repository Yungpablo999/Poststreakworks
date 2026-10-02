// App-wide actions the desktop web layout needs from anywhere (App.tsx sets
// them up): start a new post, optionally with an idea's title filled in.

let composerOpener: ((title?: string) => void) | null = null;

export function setComposerOpener(fn: ((title?: string) => void) | null) {
  composerOpener = fn;
}

export function openComposer(title?: string) {
  composerOpener?.(title);
}

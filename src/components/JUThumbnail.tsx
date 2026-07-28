/**
 * JUThumbnail — fallback thumbnail for jammu-university documents
 * that don't have a Google Drive thumbnail.
 *
 * Displays the JU Learning logo in a 9:16 portrait aspect ratio.
 */
export function JUThumbnail() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6">
      <img
        src="/android-chrome-512x512.png"
        alt="JU Learning"
        className="h-full w-full object-contain"
      />
    </div>
  );
}

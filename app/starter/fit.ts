// Does an idea typed into "Make it with AI" sound like a one-page site for a
// business, club or event? Then the website starter is the shorter road: an
// example close to theirs, their details, and files to download, no AI app
// needed. Plain word rules; the words never leave the browser.

const SITE = /\b(?:web ?sites?|web ?pages?|landing page|home ?page|one-?page|site)\b/i;
const FOR_WHO = /\b(?:business|shop|salon|studio|bakery|caf[eé]|restaurant|food truck|catering|caterer|groom\w*|clean\w*|handyman|repairs?|plumb\w*|electrician|landscap\w*|lawn|detail\w*|barber|stylist|makeup|massage|pilates|yoga|trainer|coach\w*|tutor\w*|lessons|photograph\w*|notary|bookkeep\w*|pets?|dogs?|painter|organiz\w*|contractor|dj|pottery|maker|crafts?|designer|freelanc\w*|club|group|church|reunion|team|nonprofit|charity|practice|portfolio|services?)\b/i;
const NOT_STARTER = /\b(?:apps?|games?|log ?ins?|sign ?ups?|accounts?|members?|member area|dashboard|checkout|cart|database|booking system|scheduler|tool|calculator|quiz|store with)\b/i;

export function starterFits(text: string): boolean {
  return SITE.test(text) && FOR_WHO.test(text) && !NOT_STARTER.test(text);
}

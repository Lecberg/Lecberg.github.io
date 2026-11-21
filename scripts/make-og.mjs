// Builds public/og.png, the 1200x630 image shown when the site link is shared.
// Run with: node scripts/make-og.mjs
import sharp from "sharp";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#fafaf8"/>
  <rect x="0" y="0" width="16" height="630" fill="#095cac"/>
  <text x="90" y="150" font-family="Segoe UI, Arial, sans-serif" font-size="30" fill="#095cac">lecberg.github.io</text>
  <text x="90" y="250" font-family="Segoe UI, Arial, sans-serif" font-size="76" font-weight="700" fill="#1c1c1a">Ryan Ma</text>
  <text x="90" y="330" font-family="Segoe UI, Arial, sans-serif" font-size="40" fill="#1c1c1a">AI workflows that take over manual work,</text>
  <text x="90" y="382" font-family="Segoe UI, Arial, sans-serif" font-size="40" fill="#1c1c1a">with a person checking what goes out.</text>
  <g font-family="Segoe UI, Arial, sans-serif" font-size="26" fill="#5d5d58">
    <rect x="90" y="460" width="270" height="58" rx="10" fill="#ffffff" stroke="#e3e2dd"/>
    <text x="225" y="498" text-anchor="middle">CareerPilot AI</text>
    <rect x="380" y="460" width="330" height="58" rx="10" fill="#ffffff" stroke="#e3e2dd"/>
    <text x="545" y="498" text-anchor="middle">PPP Newsletter pipeline</text>
    <rect x="730" y="460" width="340" height="58" rx="10" fill="#e8f0f9" stroke="#095cac"/>
    <text x="900" y="498" text-anchor="middle">Traffic signs agent</text>
  </g>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("public/og.png");
console.log("wrote public/og.png");

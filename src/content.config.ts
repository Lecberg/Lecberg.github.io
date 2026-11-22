import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// One Markdown file per project in src/content/projects/.
// To add a project, copy one of the existing files and change its front matter.
const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string(),
      tagline: z.string(), // one line for the home-page card
      dates: z.string(),
      order: z.number(),
      role: z.string(),
      stack: z.array(z.string()),
      links: z.object({
        code: z.string().url(),
        demo: z.string().url().optional(),
        demoLabel: z.string().optional(),
      }),
      problem: z.string(),
      tryit: z.enum(["tpdm", "ppp", "careerpilot"]).optional(), // which hands-on panel to show

      flow: z.array(
        z.object({
          kind: z.enum(["step", "ai", "human"]),
          text: z.string(),
        }),
      ),
      figures: z.array(z.object({ value: z.string(), label: z.string() })),
      cover: image(),
      coverAlt: z.string(),
      gallery: z.array(
        z.object({ src: image(), alt: z.string(), caption: z.string() }),
      ),
    }),
});

export const collections = { projects };

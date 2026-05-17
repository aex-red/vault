import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://vault.aex.red/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "aex.red",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "vault.aex.red",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Pirata One",
        body: "Crimson Pro",
        code: "Share Tech Mono",
      },
      colors: {
        lightMode: {
          light: "#0d0a0b",
          lightgray: "#2a1f20",
          gray: "#4a3535",
          darkgray: "#c4b8b8",
          dark: "#d4c4c4",
          secondary: "#8b2020",
          tertiary: "#b03030",
          highlight: "rgba(139, 32, 32, 0.15)",
          textHighlight: "#b0302088",
        },
        darkMode: {
          light: "#0d0a0b",
          lightgray: "#2a1f20",
          gray: "#4a3535",
          darkgray: "#c4b8b8",
          dark: "#d4c4c4",
          secondary: "#8b2020",
          tertiary: "#b03030",
          highlight: "rgba(139, 32, 32, 0.15)",
          textHighlight: "#b0302088",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config

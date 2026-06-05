import {
  type DefaultTemplateArgs,
  defaultTemplateArgsSchema,
  type DirektoratTemplateArgs,
  direktoratTemplateArgsSchema,
  type DocumentTemplateOption,
  type GenerateDocumentRequestOptions,
  type PdfConfig,
} from "@repo/shared-types";
import { z } from "zod";
import { blankTemplate } from "./templates/blank";
import { defaultTemplate } from "./templates/default";
import { direktoratTemplate } from "./templates/direktorat";
import type { Template } from "./template";

const margin = {
  top: "0.5in",
  right: "1.2in",
  bottom: "1.2in",
  left: "1.2in",
};

function getDefaultArgs(options: GenerateDocumentRequestOptions): DefaultTemplateArgs {
  return defaultTemplateArgsSchema.parse(options.dynamic.defaultTemplateArgs);
}

function getDirektoratArgs(options: GenerateDocumentRequestOptions): DirektoratTemplateArgs {
  return direktoratTemplateArgsSchema.parse(options.dynamic.direktoratTemplateArgs);
}

/**
 * Adapts the `default` template's building blocks (markdown assembly, footer,
 * css) to the {@link Template} interface, owning argument extraction and the
 * PDF/footer config that used to live in the API.
 */
const defaultDocumentTemplate: Template = {
  name: "default",
  argsSchema: defaultTemplateArgsSchema,

  getMd(md, options) {
    return defaultTemplate.getMd(md, getDefaultArgs(options));
  },

  getPdfConfig(options): Partial<PdfConfig> {
    const args = getDefaultArgs(options);
    return {
      css: defaultTemplate.globalCss,
      pdf_options: {
        displayHeaderFooter: true,
        headerTemplate: "<div></div>",
        footerTemplate: defaultTemplate.getFooter(args.fields),
        margin,
      },
    };
  },
};

/**
 * Adapts the `direktorat` template's building blocks to the {@link Template}
 * interface, owning argument extraction so the API never special-cases it.
 */
const direktoratDocumentTemplate: Template = {
  name: "direktorat",
  argsSchema: direktoratTemplateArgsSchema,

  getMd(md, options) {
    return direktoratTemplate.getMd(md, getDirektoratArgs(options));
  },

  getPdfConfig(options): Partial<PdfConfig> {
    const args = getDirektoratArgs(options);
    return {
      css: direktoratTemplate.globalCss,
      pdf_options: {
        displayHeaderFooter: true,
        headerTemplate: "<div></div>",
        footerTemplate: direktoratTemplate.getFooter(args.fields),
        margin,
      },
    };
  },
};

/**
 * Adapts the `blank` template to the {@link Template} interface. It takes no
 * arguments: the body markdown is left untouched and only the shared css and
 * page margins are applied.
 */
const blankDocumentTemplate: Template = {
  name: "blank",
  argsSchema: z.undefined(),

  getMd(md) {
    return md;
  },

  getPdfConfig(): Partial<PdfConfig> {
    return {
      css: blankTemplate.globalCss,
      pdf_options: {
        margin,
      },
    };
  },
};

const templates: Template[] = [
  defaultDocumentTemplate,
  direktoratDocumentTemplate,
  blankDocumentTemplate,
];

/**
 * Resolve a document template by its name. When no template is specified the
 * `default` template is used, mirroring the API's defaulting behaviour.
 *
 * Returns `undefined` for the `custom` template, which is intentionally not
 * part of the registry: the caller supplies its full config directly.
 */
export function resolveTemplate(
  resolved: DocumentTemplateOption | undefined = "default",
): Template | undefined {
  return templates.find((template) => template.name === resolved);
}

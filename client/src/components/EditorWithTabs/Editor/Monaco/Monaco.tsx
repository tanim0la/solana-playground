import { useEffect, useRef, useState } from "react";
import { useTheme } from "styled-components";
import * as monaco from "monaco-editor";

import { initLanguages } from "./languages";
import { EventName } from "../../../../constants";
import {
  Highlight,
  Lang,
  PgCommand,
  PgCommon,
  PgExplorer,
  PgPackage,
  PgProgramInfo,
  PgTerminal,
} from "../../../../utils/pg";
import {
  useAsyncEffect,
  useKeybind,
  useSendAndReceiveCustomEvent,
} from "../../../../hooks";

const Monaco = () => {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>();
  const [isThemeSet, setIsThemeSet] = useState(false);

  const monacoRef = useRef<HTMLDivElement>(null);

  // Set default options
  useEffect(() => {
    // Compiler options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      lib: ["es2020"],
      module: monaco.languages.typescript.ModuleKind.ESNext,
      target: monaco.languages.typescript.ScriptTarget.ES2017,
      allowNonTsExtensions: true,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      lib: ["es2020"],
      module: monaco.languages.typescript.ModuleKind.ESNext,
      target: monaco.languages.typescript.ScriptTarget.ES2017,
      allowNonTsExtensions: true,
    });

    // Diagnostic options
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      diagnosticCodesToIgnore: [
        1375, // top level await
        2686, // UMD global because of module
      ],
    });
  }, []);

  const theme = useTheme();

  // Set theme
  useAsyncEffect(async () => {
    const editorStyles = theme.components.editor;
    const hl = theme.highlight;

    if (theme.isDark) {
      // Monaco only takes hex values
      const orTransparent = (v: string) => {
        return v === "transparent" || v === "inherit" ? "#00000000" : v;
      };

      monaco.editor.defineTheme(theme.name, {
        base: "vs-dark",
        inherit: true,
        colors: {
          /////////////////////////////// General //////////////////////////////
          foreground: editorStyles.default.color,
          errorForeground: theme.colors.state.error.color,
          descriptionForeground: theme.colors.default.textSecondary,
          focusBorder:
            theme.colors.default.primary + theme.default.transparency!.high,

          /////////////////////////////// Editor ///////////////////////////////
          "editor.foreground": editorStyles.default.color,
          "editor.background": orTransparent(editorStyles.default.bg),
          "editorCursor.foreground": editorStyles.default.cursorColor,
          "editor.lineHighlightBackground": orTransparent(
            editorStyles.default.activeLine.bg
          ),
          "editor.lineHighlightBorder": orTransparent(
            editorStyles.default.activeLine.borderColor
          ),
          "editor.selectionBackground": editorStyles.default.selection.bg,
          "editor.inactiveSelectionBackground":
            editorStyles.default.searchMatch.bg,
          "editorGutter.background": orTransparent(editorStyles.gutter.bg),
          "editorLineNumber.foreground": editorStyles.gutter.color,
          "editorError.foreground": theme.colors.state.error.color,
          "editorWarning.foreground": theme.colors.state.warning.color,

          ////////////////////////////// Dropdown //////////////////////////////
          "dropdown.background": editorStyles.tooltip.bg,
          "dropdown.foreground": editorStyles.tooltip.color,

          /////////////////////////////// Widget ///////////////////////////////
          "editorWidget.background": editorStyles.tooltip.bg,
          "editorHoverWidget.background": editorStyles.tooltip.bg,
          "editorHoverWidget.border": editorStyles.tooltip.borderColor,

          //////////////////////////////// List ////////////////////////////////
          "list.hoverBackground": theme.colors.state.hover.bg!,
          "list.activeSelectionBackground": editorStyles.tooltip.selectedBg,
          "list.activeSelectionForeground": editorStyles.tooltip.selectedColor,
          "list.inactiveSelectionBackground": editorStyles.tooltip.bg,
          "list.inactiveSelectionForeground": editorStyles.tooltip.color,
          "list.highlightForeground": theme.colors.state.info.color,

          //////////////////////////////// Input ///////////////////////////////
          "input.background": theme.components.input.bg!,
          "input.foreground": theme.components.input.color,
          "input.border": theme.components.input.borderColor,
          "inputOption.activeBorder":
            theme.colors.default.primary + theme.default.transparency.high,
          "input.placeholderForeground": theme.colors.default.textSecondary,
          "inputValidation.infoBackground": theme.colors.state.info.bg!,
          "inputValidation.infoBorder": theme.colors.state.info.color,
          "inputValidation.warningBackground": theme.colors.state.warning.bg!,
          "inputValidation.warningBorder": theme.colors.state.warning.color,
          "inputValidation.errorBackground": theme.colors.state.error.bg!,
          "inputValidation.errorBorder": theme.colors.state.error.color,

          /////////////////////////////// Minimap //////////////////////////////
          "minimap.background": orTransparent(editorStyles.minimap.bg),
          "minimap.selectionHighlight": editorStyles.minimap.selectionHighlight,

          ////////////////////////////// Peek view /////////////////////////////
          "peekView.border": orTransparent(editorStyles.peekView.borderColor),
          "peekViewTitle.background": editorStyles.peekView.title.bg,
          "peekViewTitleLabel.foreground":
            editorStyles.peekView.title.labelColor,
          "peekViewTitleDescription.foreground":
            editorStyles.peekView.title.descriptionColor,
          "peekViewEditor.background": editorStyles.peekView.editor.bg,
          "peekViewEditor.matchHighlightBackground":
            editorStyles.peekView.editor.matchHighlightBg,
          "peekViewEditorGutter.background":
            editorStyles.peekView.editor.gutterBg,
          "peekViewResult.background": editorStyles.peekView.result.bg,
          "peekViewResult.lineForeground":
            editorStyles.peekView.result.lineColor,
          "peekViewResult.fileForeground":
            editorStyles.peekView.result.fileColor,
          "peekViewResult.selectionBackground":
            editorStyles.peekView.result.selectionBg,
          "peekViewResult.selectionForeground":
            editorStyles.peekView.result.selectionColor,
          "peekViewResult.matchHighlightBackground":
            editorStyles.peekView.result.matchHighlightBg,
        },
        rules: [],
      });
      monaco.editor.setTheme(theme.name);
    } else {
      monaco.editor.setTheme("vs");
    }

    const createSettings = (token: Highlight[keyof Highlight]) => ({
      foreground: token.color,
      fontStyle: token.fontStyle,
    });

    // Initialize language grammars and configurations
    const { dispose } = await initLanguages({
      name: theme.name,
      settings: [
        //////////////////////////////// Default ///////////////////////////////
        {
          // Can't directly set scrollbar background.
          // See https://github.com/microsoft/monaco-editor/issues/908#issuecomment-433739458
          name: "Defaults",

          settings: {
            background:
              // Transparent background results with a full black background
              editorStyles.default.bg === "transparent"
                ? theme.colors.default.bgPrimary
                : editorStyles.default.bg,
            foreground: editorStyles.default.color,
          },
        },

        //////////////////////////////// Boolean ///////////////////////////////
        {
          name: "Boolean",
          scope: [
            "constant.language.bool",
            "constant.language.boolean",
            "constant.language.json",
          ],
          settings: createSettings(hl.bool),
        },

        //////////////////////////////// Integer ///////////////////////////////
        {
          name: "Integers",
          scope: "constant.numeric",
          settings: createSettings(hl.integer),
        },

        //////////////////////////////// String ////////////////////////////////
        {
          name: "Strings",
          scope: [
            "string.quoted.single",
            "string.quoted.double",
            "string.template.ts",
          ],
          settings: createSettings(hl.string),
        },

        ///////////////////////////////// Regex ////////////////////////////////
        {
          name: "Regular expressions",
          scope: ["string.regexp.ts"],
          settings: createSettings(hl.regexp),
        },

        /////////////////////////////// Function ///////////////////////////////
        {
          name: "Functions",
          scope: ["entity.name.function", "meta.function-call.generic.python"],
          settings: createSettings(hl.functionCall),
        },
        {
          name: "Function parameter",
          scope: [
            "variable.parameter",
            "variable.parameter.ts",
            "entity.name.variable.parameter",
            "variable.other.jsdoc",
          ],
          settings: createSettings(hl.functionArg),
        },

        /////////////////////////////// Constant ///////////////////////////////
        {
          name: "Constants",
          scope: [
            "variable.other.constant.ts",
            "variable.other.constant.property.ts",
          ],
          settings: createSettings(hl.constant),
        },

        /////////////////////////////// Variable ///////////////////////////////
        {
          name: "Variables",
          scope: [
            "variable.other",
            "variable.object.property.ts",
            "meta.object-literal.key.ts",
          ],
          settings: createSettings(hl.variableName),
        },
        {
          name: "Special variable",
          scope: [
            "variable.language.self.rust",
            "variable.language.super.rust",
            "variable.language.this.ts",
          ],
          settings: createSettings(hl.specialVariable),
        },

        //////////////////////////////// Keyword ///////////////////////////////
        {
          name: "Storage types",
          scope: "storage.type",
          settings: createSettings(hl.keyword),
        },
        {
          name: "Storage modifiers",
          scope: "storage.modifier",
          settings: createSettings(hl.modifier),
        },
        {
          name: "Control keywords",
          scope: "keyword.control",
          settings: createSettings(hl.controlKeyword),
        },
        {
          name: "Other",
          scope: ["keyword.other", "keyword.operator.new.ts"],
          settings: createSettings(hl.keyword),
        },

        /////////////////////////////// Operator ///////////////////////////////
        {
          name: "Operators",
          scope: [
            "keyword.operator",
            "punctuation.separator.key-value",
            "storage.type.function.arrow.ts",
          ],
          settings: createSettings(hl.operator),
        },

        ///////////////////////////////// Type /////////////////////////////////
        {
          name: "Types",
          scope: [
            "entity.name.type",
            "support.type",
            "entity.other.inherited-class.python",
          ],
          settings: createSettings(hl.typeName),
        },

        ////////////////////////////// Punctuation /////////////////////////////
        {
          name: ".",
          scope: ["punctuation.accessor", "punctuation.separator.period"],
          settings: createSettings(hl.operator),
        },
        {
          name: ",",
          scope: "punctuation.separator.comma",
          settings: createSettings(hl.variableName),
        },
        {
          name: ";",
          scope: "punctuation.terminator.statement",
          settings: createSettings(hl.variableName),
        },
        {
          name: "${}",
          scope: [
            "punctuation.definition.template-expression.begin.ts",
            "punctuation.definition.template-expression.end.ts",
          ],
          settings: createSettings(hl.modifier),
        },

        //////////////////////////////// Import ////////////////////////////////
        {
          name: "`import`",
          scope: "keyword.control.import.ts",
          settings: createSettings(hl.keyword),
        },
        {
          name: "import `*`",
          scope: "constant.language.import-export-all.ts",
          settings: createSettings(hl.constant),
        },
        {
          name: "import * `as`",
          scope: "keyword.control.as.ts",
          settings: createSettings(hl.controlKeyword),
        },
        {
          name: "import * as `alias`",
          scope: "variable.other.readwrite.alias.ts",
          settings: createSettings(hl.variableName),
        },
        {
          name: "import * as alias `from`",
          scope: "keyword.control.from.ts",
          settings: createSettings(hl.keyword),
        },

        //////////////////////////////// Macros ////////////////////////////////
        {
          name: "Macros",
          scope: [
            "meta.attribute.rust",
            "entity.name.function.decorator.python",
          ],
          settings: createSettings(hl.meta),
        },

        //////////////////////////////// Comment ///////////////////////////////
        {
          name: "Comments",
          scope: [
            "comment.line",
            "comment.block",
            "punctuation.definition.comment.ts",
          ],
          settings: createSettings(hl.lineComment),
        },
        {
          name: "JSDoc comments",
          scope: [
            "punctuation.definition.block.tag.jsdoc",
            "storage.type.class.jsdoc",
          ],
          settings: createSettings(hl.keyword),
        },

        ///////////////////////////////// Rust /////////////////////////////////
        {
          name: "Lifetimes",
          scope: [
            "punctuation.definition.lifetime.rust",
            "entity.name.type.lifetime.rust",
          ],
          settings: createSettings(hl.specialVariable),
        },
      ],
    });

    setIsThemeSet(true);

    return () => dispose();
  }, [theme]);

  // Set font
  useEffect(() => {
    editor?.updateOptions({
      fontFamily: theme.components.editor.default.fontFamily,
    });
  }, [editor, theme]);

  // Create editor
  useEffect(() => {
    if (editor || !isThemeSet || !monacoRef.current) return;

    setEditor(
      monaco.editor.create(monacoRef.current, {
        automaticLayout: true,
        fontLigatures: true,
        tabSize: 2,
      })
    );
  }, [editor, isThemeSet]);

  // Set editor state
  useEffect(() => {
    if (!editor) return;
    let positionDataIntervalId: NodeJS.Timer;

    const switchFile = PgExplorer.onDidSwitchFile((curFile) => {
      if (!curFile) return;

      // Clear previous state
      positionDataIntervalId && clearInterval(positionDataIntervalId);

      // Check whether the model has already been created
      const uriPath = curFile.path.replace(/\s*/g, "");
      const model =
        monaco.editor.getModels().find((model) => model.uri.path === uriPath) ??
        monaco.editor.createModel(
          curFile.content!,
          undefined,
          monaco.Uri.parse(uriPath)
        );

      // Set editor model
      editor.setModel(model);

      // Get position data
      const position = PgExplorer.getEditorPosition(curFile.path);

      // Scroll to the saved line
      editor.setScrollTop(
        position.topLineNumber
          ? editor.getTopForLineNumber(position.topLineNumber)
          : 0
      );

      // Set the cursor position
      const startPosition = model.getPositionAt(position.cursor.from);
      const endPosition = model.getPositionAt(position.cursor.to);
      editor.setSelection({
        startLineNumber: startPosition.lineNumber,
        startColumn: startPosition.column,
        endLineNumber: endPosition.lineNumber,
        endColumn: endPosition.column,
      });

      // Focus the editor
      editor.focus();

      // Save position data
      positionDataIntervalId = setInterval(() => {
        const selection = editor.getSelection();
        if (!selection) return;

        PgExplorer.saveEditorPosition(curFile.path, {
          cursor: {
            from: model.getOffsetAt(selection.getStartPosition()),
            to: model.getOffsetAt(selection.getEndPosition()),
          },
          topLineNumber: editor.getVisibleRanges()[0].startLineNumber,
        });
      }, 1000);
    });

    return () => {
      clearInterval(positionDataIntervalId);
      monaco.editor.getModels().forEach((model) => model.dispose());
      switchFile.dispose();
    };
  }, [editor]);

  // Auto save
  useEffect(() => {
    if (!editor) return;

    let timeoutId: NodeJS.Timeout;

    const disposable = editor.onDidChangeModelContent(() => {
      timeoutId && clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const curFile = PgExplorer.getCurrentFile();
        if (!curFile) return;

        const args: [string, string] = [curFile.path, editor.getValue()];

        // Save to state
        PgExplorer.saveFileToState(...args);

        // Only save to `indexedDB` when not shared
        if (PgExplorer.isTemporary) return;

        // Save to `indexedDB`
        try {
          await PgExplorer.fs.writeFile(...args);
        } catch (e: any) {
          console.log(`Error saving file ${curFile.path}. ${e.message}`);
        }
      }, 500);
    });

    return () => {
      clearTimeout(timeoutId);
      disposable.dispose();
    };
  }, [editor]);

  // Editor custom events
  useEffect(() => {
    if (!editor) return;

    const handleFocus = () => {
      if (!editor.hasTextFocus()) editor.focus();
    };

    document.addEventListener(EventName.EDITOR_FOCUS, handleFocus);
    return () => {
      document.removeEventListener(EventName.EDITOR_FOCUS, handleFocus);
    };
  }, [editor]);

  // Format event
  useSendAndReceiveCustomEvent(
    EventName.EDITOR_FORMAT,
    async (ev?: { lang: Lang; fromTerminal: boolean }) => {
      if (!editor) return;

      const lang = PgExplorer.getCurrentFileLanguage();
      if (!lang) return;

      let formatRust;
      const isCurrentFileRust = lang === Lang.RUST;
      if (isCurrentFileRust) {
        formatRust = async () => {
          const currentContent = editor.getValue();
          const model = editor.getModel();
          if (!model) return;

          const { rustfmt } = await PgPackage.import("rustfmt");

          let result;
          try {
            result = rustfmt(currentContent);
          } catch (e: any) {
            result = { error: () => e.message };
          }
          if (result.error()) {
            PgTerminal.log(PgTerminal.error("Unable to format the file."));
            return;
          }

          const pos = editor.getPosition();
          if (!pos) return;
          let cursorOffset = model.getOffsetAt(pos);

          const currentLine = model.getLineContent(pos.lineNumber);
          const beforeLine = model.getLineContent(pos.lineNumber - 1);
          const afterLine =
            pos.lineNumber === model.getLineCount()
              ? ""
              : model.getLineContent(pos.lineNumber + 1);
          const searchText = [beforeLine, currentLine, afterLine].reduce(
            (acc, cur) => acc + cur + "\n",
            ""
          );

          const formattedCode = result.code!();
          const searchIndex = formattedCode.indexOf(searchText);
          if (searchIndex !== -1) {
            // Check if there are multiple instances of the same searchText
            const nextSearchIndex = formattedCode.indexOf(
              searchText,
              searchIndex + searchText.length
            );
            if (nextSearchIndex === -1) {
              cursorOffset =
                searchIndex +
                cursorOffset -
                model.getOffsetAt({
                  lineNumber: pos.lineNumber - 1,
                  column: 0,
                });
            }
          }

          const endLineNumber = model.getLineCount();
          const endColumn = model.getLineContent(endLineNumber).length + 1;

          // Execute edits pushes the changes to the undo stack
          editor.executeEdits(null, [
            {
              text: formattedCode,
              range: {
                startLineNumber: 1,
                endLineNumber,
                startColumn: 0,
                endColumn,
              },
            },
          ]);

          const resultPos = model.getPositionAt(cursorOffset);
          editor.setPosition(resultPos);

          if (ev?.fromTerminal) {
            PgTerminal.log(PgTerminal.success("Format successful."));
          }
        };
      }

      const isCurrentFileJsLike = PgExplorer.isCurrentFileJsLike();
      let formatJSTS;
      if (isCurrentFileJsLike) {
        formatJSTS = async () => {
          const currentContent = editor.getValue();

          const model = editor.getModel();
          if (!model) return;

          const { formatWithCursor } = await import("prettier/standalone");
          const { default: parserTypescript } = await import(
            "prettier/parser-typescript"
          );

          const pos = editor.getPosition() ?? { lineNumber: 1, column: 0 };

          const result = formatWithCursor(currentContent, {
            parser: "typescript",
            plugins: [parserTypescript],
            cursorOffset: model.getOffsetAt(pos),
          });

          const endLineNumber = model.getLineCount();
          const endColumn = model.getLineContent(endLineNumber).length + 1;

          // Execute edits pushes the changes to the undo stack
          editor.executeEdits(null, [
            {
              text: result.formatted,
              range: {
                startLineNumber: 1,
                endLineNumber,
                startColumn: 0,
                endColumn,
              },
            },
          ]);

          const resultPos = model.getPositionAt(result.cursorOffset);
          editor.setPosition(resultPos);

          if (ev?.fromTerminal) {
            PgTerminal.log(PgTerminal.success("Format successful."));
          }
        };
      }

      const isCurrentFileJSON = lang === Lang.JSON;
      let formatJSON;
      if (isCurrentFileJSON) {
        formatJSON = () => {
          const model = editor.getModel();
          if (!model) return;

          const pos = editor.getPosition();
          if (!pos) return;
          let cursorOffset = model.getOffsetAt(pos);
          const currentLine = model.getLineContent(pos.lineNumber);
          const beforeLine = model.getLineContent(pos.lineNumber - 1);
          const afterLine = model.getLineContent(pos.lineNumber + 1);
          const searchText = [beforeLine, currentLine, afterLine].reduce(
            (acc, cur) => acc + cur + "\n",
            ""
          );

          const formattedCode = PgCommon.prettyJSON(
            JSON.parse(editor.getValue())
          );
          const searchIndex = formattedCode.indexOf(searchText);
          if (searchIndex !== -1) {
            // Check if there are multiple instances of the same searchText
            const nextSearchIndex = formattedCode.indexOf(
              searchText,
              searchIndex + searchText.length
            );
            if (nextSearchIndex === -1) {
              cursorOffset =
                searchIndex +
                cursorOffset -
                model.getOffsetAt({
                  lineNumber: pos.lineNumber - 1,
                  column: 0,
                });
            }
          }

          const endLineNumber = model.getLineCount();
          const endColumn = model.getLineContent(endLineNumber).length + 1;

          // Execute edits pushes the changes to the undo stack
          editor.executeEdits(null, [
            {
              text: formattedCode,
              range: {
                startLineNumber: 1,
                endLineNumber,
                startColumn: 0,
                endColumn,
              },
            },
          ]);

          const resultPos = model.getPositionAt(cursorOffset);
          editor.setPosition(resultPos);
        };
      }

      // From keybind
      if (!ev) {
        if (isCurrentFileRust) {
          formatRust && (await formatRust());
        } else if (isCurrentFileJsLike) {
          formatJSTS && (await formatJSTS());
        } else if (isCurrentFileJSON) {
          formatJSON && formatJSON();
        }

        return;
      }

      // From terminal
      switch (ev.lang) {
        case Lang.RUST: {
          if (!isCurrentFileRust) {
            PgTerminal.log(
              PgTerminal.warning("Current file is not a Rust file.")
            );
            return;
          }

          formatRust && (await formatRust());
          break;
        }

        case Lang.TYPESCRIPT: {
          if (!isCurrentFileJsLike) {
            PgTerminal.log(
              PgTerminal.warning("Current file is not a JS/TS file.")
            );
            return;
          }

          formatJSTS && (await formatJSTS());
        }
      }
    },
    [editor]
  );

  // Format on keybind
  useKeybind(
    "Ctrl+S",
    () => {
      if (editor?.hasTextFocus()) {
        PgTerminal.process(async () => {
          await PgCommon.sendAndReceiveCustomEvent(EventName.EDITOR_FORMAT);
        });
      }
    },
    [editor]
  );

  // Default and disposable declarations
  useAsyncEffect(async () => {
    const { declareDefaultTypes } = await import("./declarations/default");
    await declareDefaultTypes();

    const { declareDisposableTypes } = await import(
      "./declarations/disposable"
    );
    const disposables = declareDisposableTypes();

    return () => disposables.dispose();
  }, []);

  // Importable declarations
  useEffect(() => {
    if (!editor) return;
    let declareImportablesTimoutId: NodeJS.Timer;

    const declareImportables = async () => {
      const { declareImportableTypes } = await import(
        "./declarations/importable"
      );
      await declareImportableTypes(editor.getValue());
    };

    const switchFile = PgExplorer.onDidSwitchFile(declareImportables);

    const changeContent = editor.onDidChangeModelContent(() => {
      clearTimeout(declareImportablesTimoutId);
      declareImportablesTimoutId = setTimeout(declareImportables, 1000);
    });

    return () => {
      clearTimeout(declareImportablesTimoutId);
      switchFile.dispose();
      changeContent.dispose();
    };
  }, [editor]);

  // Update program id
  useEffect(() => {
    if (!editor) return;

    const getProgramIdStartAndEndIndex = (
      content: string,
      isPython: boolean
    ) => {
      const findText = isPython ? "declare_id" : "declare_id!";
      const findTextIndex = content.indexOf(findText);
      if (!content || !findTextIndex || findTextIndex === -1) return;
      const quoteStartIndex = findTextIndex + findText.length + 1;
      const quoteChar = content[quoteStartIndex];
      const quoteEndIndex = content.indexOf(quoteChar, quoteStartIndex + 1);

      return [quoteStartIndex, quoteEndIndex];
    };

    const updateId = async () => {
      const programPkStr = PgProgramInfo.getPkStr();
      if (!programPkStr) return;

      // Update in editor
      const currentLang = PgExplorer.getCurrentFileLanguage();
      const isRust = currentLang === Lang.RUST;
      const isPython = currentLang === Lang.PYTHON;
      if (!isRust && !isPython) return;

      const editorContent = editor.getValue();
      const indices = getProgramIdStartAndEndIndex(editorContent, isPython);
      if (!indices) return;
      const [quoteStartIndex, quoteEndIndex] = indices;

      const model = editor.getModel();
      if (!model) return;

      const startPos = model.getPositionAt(quoteStartIndex + 1);
      const endPos = model.getPositionAt(quoteEndIndex);
      const range = monaco.Range.fromPositions(startPos, endPos);

      try {
        editor.executeEdits(null, [{ range, text: programPkStr }]);
      } catch (e: any) {
        console.log("Program ID update error:", e.message);
      }
    };

    const { dispose } = PgCommon.batchChanges(updateId, [
      PgCommand.build.onDidRunStart,
      PgProgramInfo.onDidChangePk,
    ]);

    return () => dispose();
  }, [editor]);

  return <div ref={monacoRef} />;
};

export default Monaco;

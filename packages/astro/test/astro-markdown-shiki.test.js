import { expect } from 'chai';
import cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';
import markdownRemark from '@astrojs/markdown-remark';

const riGrammar = JSON.parse(
	String.raw`{"name":"rinfo","patterns":[{"include":"#lf-rinfo"}],"repository":{"lf-rinfo":{"patterns":[{"include":"#control"},{"include":"#operator"},{"include":"#strings"},{"include":"#number"},{"include":"#comment"},{"include":"#literal"}]},"control":{"patterns":[{"name":"keyword.control.ri","match":"\\b(si|mientras|repetir)\\b"},{"name":"keyword.other.ri","match":"\\b(programa|robots|areas|variables|comenzar|fin)\\b"},{"name":"support.function.other.ri","match":"\\b(tomarFlor|HayFlorEnLaBolsa|HayFlorEnLaEsquina|depositarFlor|HayPapelEnLaBolsa|HayPapelEnLaEsquina|tomarPapel|depositarPapel)\\b"}]},"operator":{"comment":"Captures operators and also puts them in different sub-groups that further describe them","patterns":[{"match":"\\+|-|\\*|/","name":"keyword.operator.arithmetic.ri"},{"match":"<|>|<=|>=|=|<>|!=","name":"keyword.operator.comparison.ri"},{"match":"\\b(Pos|Informar|Leer|Iniciar|AsignarArea|AreaC)\\b","name":"support.function.arithmetic.ri"},{"match":":=","name":"keyword.operator.assign.ri"},{"match":"(&|~)","name":"support.function.logical.ri"}]},"strings":{"name":"string.quoted.double.ri","beginCaptures":{"0":{"name":"string.quoted.double.begin.ri"}},"endCaptures":{"0":{"name":"string.quoted.double.end.ri"}},"begin":"\"","end":"\"","patterns":[{"name":"constant.character.escape.ri","match":"\\\\."}]},"comment":{"patterns":[{"name":"comment.block.ri","begin":"{","end":"}","patterns":[{"include":"#comment"}]}]},"literal":{"patterns":[{"name":"constant.language.ri","match":"\\b(verdadero|falso|boolean|numero)\\b"}]},"number":{"patterns":[{"comment":"Captures decimal numbers, with the negative sign being considered an operator","match":"(-)?(?:((?:\\b\\d+(?:\\.\\d*)?|\\.\\d+)(?:\\b|e-?\\d+\\b)%?)|(\\$[0-9]+\\b))","captures":{"1":{"name":"keyword.operator.arithmetic.ri"},"2":{"name":"constant.numeric.decimal.ri"},"3":{"name":"constant.numeric.hex.ri"}}}]}},"scopeName":"source.rinfo"}`
);
const serendipity = JSON.parse(
	String.raw`{"name":"Serendipity Morning","type":"light","colors":{"activityBar.activeBorder":"#4E5377","activityBar.background":"#FDFDFE","activityBar.dropBorder":"#D8DAE4","activityBar.foreground":"#4E5377","activityBar.inactiveForeground":"#5F6488","activityBarBadge.background":"#F19A8E","activityBarBadge.foreground":"#FDFDFE","badge.background":"#F19A8E","badge.foreground":"#FDFDFE","banner.background":"#F1F1F4","banner.foreground":"#4E5377","banner.iconForeground":"#5F6488","breadcrumb.activeSelectionForeground":"#F19A8E","breadcrumb.background":"#FDFDFE","breadcrumb.focusForeground":"#5F6488","breadcrumb.foreground":"#8388AD","breadcrumbPicker.background":"#F1F1F4","button.background":"#F19A8E","button.foreground":"#FDFDFE","button.hoverBackground":"#F19A8Ee6","button.secondaryBackground":"#F1F1F4","button.secondaryForeground":"#4E5377","button.secondaryHoverBackground":"#D8DAE4","charts.lines":"#5F6488","charts.foreground":"#4E5377","charts.blue":"#7397DE","charts.green":"#3788BE","charts.orange":"#F19A8E","charts.purple":"#77AAB3","charts.red":"#D26A5D","charts.yellow":"#886CDB","checkbox.background":"#F1F1F4","checkbox.border":"#6e6a8614","checkbox.foreground":"#4E5377","debugExceptionWidget.background":"#F1F1F4","debugExceptionWidget.border":"#6e6a8614","debugIcon.breakpointCurrentStackframeForeground":"#5F6488","debugIcon.breakpointDisabledForeground":"#5F6488","debugIcon.breakpointForeground":"#5F6488","debugIcon.breakpointStackframeForeground":"#5F6488","debugIcon.breakpointUnverifiedForeground":"#5F6488","debugIcon.continueForeground":"#5F6488","debugIcon.disconnectForeground":"#5F6488","debugIcon.pauseForeground":"#5F6488","debugIcon.restartForeground":"#5F6488","debugIcon.startForeground":"#5F6488","debugIcon.stepBackForeground":"#5F6488","debugIcon.stepIntoForeground":"#5F6488","debugIcon.stepOutForeground":"#5F6488","debugIcon.stepOverForeground":"#5F6488","debugIcon.stopForeground":"#D26A5D","debugToolBar.background":"#F1F1F4","debugToolBar.border":"#D8DAE4","descriptionForeground":"#5F6488","diffEditor.border":"#D8DAE4","diffEditor.diagonalFill":"#6e6a8626","diffEditor.insertedTextBackground":"#7397DE14","diffEditor.insertedTextBorder":"#7397DE80","diffEditor.removedTextBackground":"#D26A5D14","diffEditor.removedTextBorder":"#D26A5D80","dropdown.background":"#F1F1F4","dropdown.border":"#6e6a8614","dropdown.foreground":"#4E5377","dropdown.listBackground":"#F1F1F4","editor.background":"#FDFDFE","editor.findMatchBackground":"#6e6a8626","editor.findMatchHighlightBackground":"#6e6a8626","editor.findRangeHighlightBackground":"#6e6a8626","editor.findRangeHighlightBorder":"#0000","editor.focusedStackFrameHighlightBackground":"#6e6a8614","editor.foldBackground":"#F1F1F4","editor.foreground":"#4E5377","editor.hoverHighlightBackground":"#0000","editor.inactiveSelectionBackground":"#6e6a860d","editor.inlineValuesBackground":"#0000","editor.inlineValuesForeground":"#5F6488","editor.lineHighlightBackground":"#6e6a860d","editor.lineHighlightBorder":"#0000","editor.linkedEditingBackground":"#F1F1F4","editor.rangeHighlightBackground":"#6e6a860d","editor.rangeHighlightBorder":"#0000","editor.selectionBackground":"#6e6a8614","editor.selectionForeground":"#4E5377","editor.selectionHighlightBackground":"#6e6a8614","editor.selectionHighlightBorder":"#0000","editor.snippetFinalTabstopHighlightBackground":"#6e6a8614","editor.snippetFinalTabstopHighlightBorder":"#F1F1F4","editor.snippetTabstopHighlightBackground":"#6e6a8614","editor.snippetTabstopHighlightBorder":"#F1F1F4","editor.stackFrameHighlightBackground":"#6e6a8614","editor.symbolHighlightBackground":"#6e6a8614","editor.symbolHighlightBorder":"#0000","editor.wordHighlightBackground":"#6e6a8614","editor.wordHighlightBorder":"#0000","editor.wordHighlightStrongBackground":"#6e6a8614","editor.wordHighlightStrongBorder":"#6e6a8614","editorBracketHighlight.foreground1":"#D26A5D80","editorBracketHighlight.foreground2":"#3788BE80","editorBracketHighlight.foreground3":"#886CDB80","editorBracketHighlight.foreground4":"#7397DE80","editorBracketHighlight.foreground5":"#F19A8E80","editorBracketHighlight.foreground6":"#77AAB380","editorBracketMatch.background":"#0000","editorBracketMatch.border":"#5F6488","editorBracketPairGuide.activeBackground1":"#3788BE","editorBracketPairGuide.activeBackground2":"#F19A8E","editorBracketPairGuide.activeBackground3":"#77AAB3","editorBracketPairGuide.activeBackground4":"#7397DE","editorBracketPairGuide.activeBackground5":"#886CDB","editorBracketPairGuide.activeBackground6":"#D26A5D","editorBracketPairGuide.background1":"#3788BE80","editorBracketPairGuide.background2":"#F19A8E80","editorBracketPairGuide.background3":"#77AAB380","editorBracketPairGuide.background4":"#7397DE80","editorBracketPairGuide.background5":"#886CDB80","editorBracketPairGuide.background6":"#D26A5D80","editorCodeLens.foreground":"#F19A8E","editorCursor.background":"#4E5377","editorCursor.foreground":"#8388AD","editorError.border":"#0000","editorError.foreground":"#D26A5D","editorGhostText.foreground":"#5F6488","editorGroup.border":"#0000","editorGroup.dropBackground":"#F1F1F4","editorGroup.emptyBackground":"#0000","editorGroup.focusedEmptyBorder":"#0000","editorGroupHeader.noTabsBackground":"#0000","editorGroupHeader.tabsBackground":"#0000","editorGroupHeader.tabsBorder":"#0000","editorGutter.addedBackground":"#7397DE","editorGutter.background":"#0000","editorGutter.commentRangeForeground":"#5F6488","editorGutter.deletedBackground":"#D26A5D","editorGutter.foldingControlForeground":"#77AAB3","editorGutter.modifiedBackground":"#F19A8E","editorHint.border":"#0000","editorHint.foreground":"#5F6488","editorHoverWidget.background":"#F1F1F4","editorHoverWidget.border":"#8388AD80","editorHoverWidget.foreground":"#5F6488","editorHoverWidget.highlightForeground":"#4E5377","editorHoverWidget.statusBarBackground":"#0000","editorIndentGuide.activeBackground":"#8388AD","editorIndentGuide.background":"#6e6a8626","editorInfo.border":"#D8DAE4","editorInfo.foreground":"#7397DE","editorInlayHint.background":"#D8DAE4","editorInlayHint.foreground":"#5F6488","editorInlayHint.parameterBackground":"#D8DAE4","editorInlayHint.parameterForeground":"#77AAB3","editorInlayHint.typeBackground":"#D8DAE4","editorInlayHint.typeForeground":"#7397DE","editorLightBulb.foreground":"#3788BE","editorLightBulbAutoFix.foreground":"#F19A8E","editorLineNumber.activeForeground":"#4E5377","editorLineNumber.foreground":"#5F6488","editorLink.activeForeground":"#F19A8E","editorMarkerNavigation.background":"#F1F1F4","editorMarkerNavigationError.background":"#F1F1F4","editorMarkerNavigationInfo.background":"#F1F1F4","editorMarkerNavigationWarning.background":"#F1F1F4","editorOverviewRuler.addedForeground":"#7397DE80","editorOverviewRuler.background":"#FDFDFE","editorOverviewRuler.border":"#6e6a8626","editorOverviewRuler.bracketMatchForeground":"#5F6488","editorOverviewRuler.commonContentForeground":"#6e6a860d","editorOverviewRuler.currentContentForeground":"#6e6a8614","editorOverviewRuler.deletedForeground":"#D26A5D80","editorOverviewRuler.errorForeground":"#D26A5D80","editorOverviewRuler.findMatchForeground":"#6e6a8626","editorOverviewRuler.incomingContentForeground":"#77AAB380","editorOverviewRuler.infoForeground":"#7397DE80","editorOverviewRuler.modifiedForeground":"#F19A8E80","editorOverviewRuler.rangeHighlightForeground":"#6e6a8626","editorOverviewRuler.selectionHighlightForeground":"#6e6a8626","editorOverviewRuler.warningForeground":"#886CDB80","editorOverviewRuler.wordHighlightForeground":"#6e6a8614","editorOverviewRuler.wordHighlightStrongForeground":"#6e6a8626","editorPane.background":"#0000","editorRuler.foreground":"#6e6a8626","editorSuggestWidget.background":"#F1F1F4","editorSuggestWidget.border":"#0000","editorSuggestWidget.focusHighlightForeground":"#F19A8E","editorSuggestWidget.foreground":"#5F6488","editorSuggestWidget.highlightForeground":"#F19A8E","editorSuggestWidget.selectedBackground":"#6e6a8614","editorSuggestWidget.selectedForeground":"#4E5377","editorSuggestWidget.selectedIconForeground":"#4E5377","editorUnnecessaryCode.border":"#0000","editorUnnecessaryCode.opacity":"#00000080","editorWarning.border":"#0000","editorWarning.foreground":"#886CDB","editorWhitespace.foreground":"#8388AD","editorWidget.background":"#F1F1F4","editorWidget.border":"#D8DAE4","editorWidget.foreground":"#5F6488","editorWidget.resizeBorder":"#8388AD","errorForeground":"#D26A5D","extensionBadge.remoteBackground":"#77AAB3","extensionBadge.remoteForeground":"#FDFDFE","extensionButton.prominentBackground":"#F19A8E","extensionButton.prominentForeground":"#FDFDFE","extensionButton.prominentHoverBackground":"#F19A8Ee6","extensionIcon.starForeground":"#F19A8E","extensionIcon.verifiedForeground":"#77AAB3","focusBorder":"#6e6a8614","foreground":"#4E5377","gitDecoration.addedResourceForeground":"#7397DE","gitDecoration.conflictingResourceForeground":"#D26A5D","gitDecoration.deletedResourceForeground":"#5F6488","gitDecoration.ignoredResourceForeground":"#8388AD","gitDecoration.modifiedResourceForeground":"#F19A8E","gitDecoration.renamedResourceForeground":"#3788BE","gitDecoration.stageDeletedResourceForeground":"#D26A5D","gitDecoration.stageModifiedResourceForeground":"#77AAB3","gitDecoration.submoduleResourceForeground":"#886CDB","gitDecoration.untrackedResourceForeground":"#886CDB","icon.foreground":"#5F6488","input.background":"#D8DAE480","input.border":"#6e6a8614","input.foreground":"#4E5377","input.placeholderForeground":"#5F6488","inputOption.activeBackground":"#F19A8E","inputOption.activeBorder":"#0000","inputOption.activeForeground":"#FDFDFE","inputValidation.errorBackground":"#0000","inputValidation.errorBorder":"#0000","inputValidation.errorForeground":"#D26A5D","inputValidation.infoBackground":"#0000","inputValidation.infoBorder":"#0000","inputValidation.infoForeground":"#7397DE","inputValidation.warningBackground":"#0000","inputValidation.warningBorder":"#0000","inputValidation.warningForeground":"#7397DE80","keybindingLabel.background":"#D8DAE4","keybindingLabel.border":"#6e6a8626","keybindingLabel.bottomBorder":"#6e6a8626","keybindingLabel.foreground":"#77AAB3","keybindingTable.headerBackground":"#D8DAE4","keybindingTable.rowsBackground":"#F1F1F4","list.activeSelectionBackground":"#6e6a8614","list.activeSelectionForeground":"#4E5377","list.activeSelectionIconForeground":"#4E5377","list.deemphasizedForeground":"#5F6488","list.dropBackground":"#F1F1F4","list.errorForeground":"#D26A5D","list.filterMatchBackground":"#F1F1F4","list.filterMatchBorder":"#F19A8E","list.focusBackground":"#6e6a8626","list.focusForeground":"#4E5377","list.focusOutline":"#6e6a8614","list.highlightForeground":"#F19A8E","list.hoverBackground":"#6e6a860d","list.hoverForeground":"#4E5377","list.inactiveFocusBackground":"#6e6a860d","list.inactiveSelectionBackground":"#F1F1F4","list.inactiveSelectionForeground":"#4E5377","list.inactiveSelectionIconForeground":"#5F6488","list.invalidItemForeground":"#D26A5D","list.warningForeground":"#886CDB","listFilterWidget.background":"#F1F1F4","listFilterWidget.noMatchesOutline":"#D26A5D","listFilterWidget.outline":"#D8DAE4","menu.background":"#F1F1F4","menu.border":"#6e6a860d","menu.foreground":"#4E5377","menu.selectionBackground":"#6e6a8614","menu.selectionBorder":"#D8DAE4","menu.selectionForeground":"#4E5377","menu.separatorBackground":"#4E5377","menubar.selectionBackground":"#6e6a8614","menubar.selectionBorder":"#6e6a860d","menubar.selectionForeground":"#4E5377","merge.border":"#D8DAE4","merge.commonContentBackground":"#6e6a8614","merge.commonHeaderBackground":"#6e6a8614","merge.currentContentBackground":"#886CDB80","merge.currentHeaderBackground":"#886CDB80","merge.incomingContentBackground":"#7397DE80","merge.incomingHeaderBackground":"#7397DE80","minimap.background":"#F1F1F4","minimap.errorHighlight":"#D26A5D80","minimap.findMatchHighlight":"#6e6a8614","minimap.selectionHighlight":"#6e6a8614","minimap.warningHighlight":"#886CDB80","minimapGutter.addedBackground":"#7397DE","minimapGutter.deletedBackground":"#D26A5D","minimapGutter.modifiedBackground":"#F19A8E","minimapSlider.activeBackground":"#6e6a8626","minimapSlider.background":"#6e6a8614","minimapSlider.hoverBackground":"#6e6a8614","notificationCenter.border":"#6e6a8614","notificationCenterHeader.background":"#F1F1F4","notificationCenterHeader.foreground":"#5F6488","notificationLink.foreground":"#77AAB3","notifications.background":"#F1F1F4","notifications.border":"#6e6a8614","notifications.foreground":"#4E5377","notificationsErrorIcon.foreground":"#D26A5D","notificationsInfoIcon.foreground":"#7397DE","notificationsWarningIcon.foreground":"#886CDB","notificationToast.border":"#6e6a8614","panel.background":"#F1F1F4","panel.border":"#0000","panel.dropBorder":"#D8DAE4","panelInput.border":"#F1F1F4","panelSection.dropBackground":"#6e6a8614","panelSectionHeader.background":"#F1F1F4","panelSectionHeader.foreground":"#4E5377","panelTitle.activeBorder":"#6e6a8626","panelTitle.activeForeground":"#4E5377","panelTitle.inactiveForeground":"#5F6488","peekView.border":"#D8DAE4","peekViewEditor.background":"#F1F1F4","peekViewEditor.matchHighlightBackground":"#6e6a8626","peekViewResult.background":"#F1F1F4","peekViewResult.fileForeground":"#5F6488","peekViewResult.lineForeground":"#5F6488","peekViewResult.matchHighlightBackground":"#6e6a8626","peekViewResult.selectionBackground":"#6e6a8614","peekViewResult.selectionForeground":"#4E5377","peekViewTitle.background":"#D8DAE4","peekViewTitleDescription.foreground":"#5F6488","pickerGroup.border":"#6e6a8626","pickerGroup.foreground":"#77AAB3","ports.iconRunningProcessForeground":"#F19A8E","problemsErrorIcon.foreground":"#D26A5D","problemsInfoIcon.foreground":"#7397DE","problemsWarningIcon.foreground":"#886CDB","progressBar.background":"#F19A8E","quickInput.background":"#F1F1F4","quickInput.foreground":"#5F6488","quickInputList.focusBackground":"#6e6a8614","quickInputList.focusForeground":"#4E5377","quickInputList.focusIconForeground":"#4E5377","scrollbar.shadow":"#0000","scrollbarSlider.activeBackground":"#6e6a8626","scrollbarSlider.background":"#6e6a860d","scrollbarSlider.hoverBackground":"#6e6a8614","searchEditor.findMatchBackground":"#6e6a8614","selection.background":"#6e6a8626","settings.focusedRowBackground":"#F1F1F4","settings.headerForeground":"#4E5377","settings.modifiedItemIndicator":"#F19A8E","settings.focusedRowBorder":"#6e6a8614","settings.rowHoverBackground":"#F1F1F4","sideBar.background":"#FDFDFE","sideBar.dropBackground":"#F1F1F4","sideBar.foreground":"#5F6488","sideBarSectionHeader.background":"#0000","sideBarSectionHeader.border":"#6e6a8614","statusBar.background":"#FDFDFE","statusBar.debuggingBackground":"#77AAB3","statusBar.debuggingForeground":"#FDFDFE","statusBar.foreground":"#5F6488","statusBar.noFolderBackground":"#FDFDFE","statusBar.noFolderForeground":"#5F6488","statusBarItem.activeBackground":"#6e6a8626","statusBarItem.hoverBackground":"#6e6a8614","statusBarItem.prominentBackground":"#D8DAE4","statusBarItem.prominentForeground":"#4E5377","statusBarItem.prominentHoverBackground":"#6e6a8614","statusBarItem.remoteBackground":"#FDFDFE","statusBarItem.remoteForeground":"#886CDB","statusBarItem.errorBackground":"#FDFDFE","statusBarItem.errorForeground":"#D26A5D","symbolIcon.arrayForeground":"#5F6488","symbolIcon.classForeground":"#5F6488","symbolIcon.colorForeground":"#5F6488","symbolIcon.constantForeground":"#5F6488","symbolIcon.constructorForeground":"#5F6488","symbolIcon.enumeratorForeground":"#5F6488","symbolIcon.enumeratorMemberForeground":"#5F6488","symbolIcon.eventForeground":"#5F6488","symbolIcon.fieldForeground":"#5F6488","symbolIcon.fileForeground":"#5F6488","symbolIcon.folderForeground":"#5F6488","symbolIcon.functionForeground":"#5F6488","symbolIcon.interfaceForeground":"#5F6488","symbolIcon.keyForeground":"#5F6488","symbolIcon.keywordForeground":"#5F6488","symbolIcon.methodForeground":"#5F6488","symbolIcon.moduleForeground":"#5F6488","symbolIcon.namespaceForeground":"#5F6488","symbolIcon.nullForeground":"#5F6488","symbolIcon.numberForeground":"#5F6488","symbolIcon.objectForeground":"#5F6488","symbolIcon.operatorForeground":"#5F6488","symbolIcon.packageForeground":"#5F6488","symbolIcon.propertyForeground":"#5F6488","symbolIcon.referenceForeground":"#5F6488","symbolIcon.snippetForeground":"#5F6488","symbolIcon.stringForeground":"#5F6488","symbolIcon.structForeground":"#5F6488","symbolIcon.textForeground":"#5F6488","symbolIcon.typeParameterForeground":"#5F6488","symbolIcon.unitForeground":"#5F6488","symbolIcon.variableForeground":"#5F6488","tab.activeBackground":"#6e6a860d","tab.activeForeground":"#4E5377","tab.activeModifiedBorder":"#7397DE","tab.border":"#0000","tab.hoverBackground":"#6e6a8614","tab.inactiveBackground":"#0000","tab.inactiveForeground":"#5F6488","tab.inactiveModifiedBorder":"#7397DE80","tab.lastPinnedBorder":"#8388AD","tab.unfocusedActiveBackground":"#0000","tab.unfocusedHoverBackground":"#0000","tab.unfocusedInactiveBackground":"#0000","tab.unfocusedInactiveModifiedBorder":"#7397DE80","terminal.ansiWhite":"#4E5377","terminal.ansiBrightWhite":"#4E5377","terminal.ansiBlack":"#D8DAE4","terminal.ansiBrightBlack":"#5F6488","terminal.ansiBlue":"#7397DE","terminal.ansiBrightBlue":"#7397DE","terminal.ansiCyan":"#F19A8E","terminal.ansiBrightCyan":"#F19A8E","terminal.ansiGreen":"#3788BE","terminal.ansiBrightGreen":"#3788BE","terminal.ansiMagenta":"#77AAB3","terminal.ansiBrightMagenta":"#77AAB3","terminal.ansiRed":"#D26A5D","terminal.ansiBrightRed":"#D26A5D","terminal.ansiBrightYellow":"#886CDB","terminal.ansiYellow":"#886CDB","terminal.dropBackground":"#6e6a8614","terminal.foreground":"#4E5377","terminal.selectionBackground":"#6e6a8614","terminal.tab.activeBorder":"#4E5377","terminalCursor.background":"#4E5377","terminalCursor.foreground":"#8388AD","textBlockQuote.background":"#F1F1F4","textBlockQuote.border":"#6e6a8614","textCodeBlock.background":"#F1F1F4","textLink.activeForeground":"#77AAB3e6","textLink.foreground":"#77AAB3","textPreformat.foreground":"#886CDB","textSeparator.foreground":"#5F6488","titleBar.activeBackground":"#FDFDFE","titleBar.activeForeground":"#5F6488","titleBar.inactiveBackground":"#F1F1F4","titleBar.inactiveForeground":"#5F6488","toolbar.activeBackground":"#6e6a8626","toolbar.hoverBackground":"#6e6a8614","tree.indentGuidesStroke":"#5F6488","walkThrough.embeddedEditorBackground":"#FDFDFE","welcomePage.background":"#FDFDFE","welcomePage.buttonBackground":"#F1F1F4","welcomePage.buttonHoverBackground":"#D8DAE4","widget.shadow":"#D8DAE44d","window.activeBorder":"#F1F1F4","window.inactiveBorder":"#F1F1F4"},"tokenColors":[{"scope":["comment"],"settings":{"foreground":"#8388AD","fontStyle":"italic"}},{"scope":["constant"],"settings":{"foreground":"#3788BE"}},{"scope":["constant.numeric","constant.language","constant.charcter.escape"],"settings":{"foreground":"#F19A8E"}},{"scope":["entity.name"],"settings":{"foreground":"#F19A8E"}},{"scope":["entity.name.section","entity.name.tag","entity.name.namespace","entity.name.type"],"settings":{"foreground":"#7397DE"}},{"scope":["entity.other.attribute-name","entity.other.inherited-class"],"settings":{"foreground":"#77AAB3","fontStyle":"italic"}},{"scope":["invalid"],"settings":{"foreground":"#D26A5D"}},{"scope":["invalid.deprecated"],"settings":{"foreground":"#5F6488"}},{"scope":["keyword"],"settings":{"foreground":"#3788BE"}},{"scope":["meta.tag","meta.brace"],"settings":{"foreground":"#4E5377"}},{"scope":["meta.import","meta.export"],"settings":{"foreground":"#3788BE"}},{"scope":"meta.directive.vue","settings":{"foreground":"#77AAB3","fontStyle":"italic"}},{"scope":"meta.property-name.css","settings":{"foreground":"#7397DE"}},{"scope":"meta.property-value.css","settings":{"foreground":"#886CDB"}},{"scope":"meta.tag.other.html","settings":{"foreground":"#5F6488"}},{"scope":["punctuation"],"settings":{"foreground":"#5F6488"}},{"scope":["punctuation.accessor"],"settings":{"foreground":"#3788BE"}},{"scope":["punctuation.definition.string"],"settings":{"foreground":"#886CDB"}},{"scope":["punctuation.definition.tag"],"settings":{"foreground":"#8388AD"}},{"scope":["storage.type","storage.modifier"],"settings":{"foreground":"#3788BE"}},{"scope":["string"],"settings":{"foreground":"#886CDB"}},{"scope":["support"],"settings":{"foreground":"#7397DE"}},{"scope":["support.constant"],"settings":{"foreground":"#886CDB"}},{"scope":["support.function"],"settings":{"foreground":"#D26A5D","fontStyle":"italic"}},{"scope":["variable"],"settings":{"foreground":"#F19A8E","fontStyle":"italic"}},{"scope":["variable.other","variable.language","variable.function","variable.argument"],"settings":{"foreground":"#4E5377"}},{"scope":["variable.parameter"],"settings":{"foreground":"#77AAB3"}}]}`
);

describe('Astro Markdown Shiki', () => {
	describe('Render shiki', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				projectRoot: './fixtures/astro-markdown-shiki/regular/',
				markdownOptions: {
					render: [markdownRemark, { syntaxHighlight: 'shiki' }],
				},
				buildOptions: {
					sitemap: false,
				},
			});
			await fixture.build();
		});

		it('Can render markdown with shiki', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			// There should be no HTML from Prism
			expect($('.token')).to.have.lengthOf(0);

			expect($('pre')).to.have.lengthOf(1);
			expect($('pre').hasClass('astro-code')).to.equal(true);
			expect($('pre').attr().style).to.equal('background-color: #0d1117; overflow-x: auto;');
		});

		it('Can render Astro <Markdown> with shiki', async () => {
			const html = await fixture.readFile('/astro/index.html');
			const $ = cheerio.load(html);

			// There should be no HTML from Prism
			expect($('.token')).to.have.lengthOf(0);

			expect($('pre')).to.have.lengthOf(2);

			expect($('span.line')).to.have.lengthOf(2);
			expect($('span.line').get(0).children).to.have.lengthOf(1);
			expect($('span.line').get(1).children).to.have.lengthOf(5);
		});
	});

	describe('Themes', () => {
		describe('Integrated theme', async () => {
			let fixture;

			before(async () => {
				fixture = await loadFixture({
					projectRoot: './fixtures/astro-markdown-shiki/themes/',
					markdownOptions: {
						render: [markdownRemark, { syntaxHighlight: 'shiki', shikiConfig: { theme: 'github-light' } }],
					},
					buildOptions: {
						sitemap: false,
					},
				});
				await fixture.build();
			});

			it('Markdown file', async () => {
				const html = await fixture.readFile('/index.html');
				const $ = cheerio.load(html);

				expect($('pre')).to.have.lengthOf(1);
				expect($('pre').hasClass('astro-code')).to.equal(true);
				expect($('pre').attr().style).to.equal('background-color: #ffffff; overflow-x: auto;');
			});

			it('<Markdown /> component', async () => {
				const html = await fixture.readFile('/astro/index.html');
				const $ = cheerio.load(html);

				expect($('pre')).to.have.lengthOf(1);
				expect($('pre').hasClass('astro-code')).to.equal(true);
				expect($('pre').attr().style).to.equal('background-color: #ffffff; overflow-x: auto;');
			});
		});

		describe('Custom theme', async () => {
			let fixture;

			before(async () => {
				fixture = await loadFixture({
					projectRoot: './fixtures/astro-markdown-shiki/themes/',
					markdownOptions: {
						render: [markdownRemark, { syntaxHighlight: 'shiki', shikiConfig: { theme: serendipity } }],
					},
					buildOptions: {
						sitemap: false,
					},
				});
				await fixture.build();
			});

			it('Markdown file', async () => {
				const html = await fixture.readFile('/index.html');
				const $ = cheerio.load(html);

				expect($('pre')).to.have.lengthOf(1);
				expect($('pre').hasClass('astro-code')).to.equal(true);
				expect($('pre').attr().style).to.equal('background-color: #FDFDFE; overflow-x: auto;');
			});

			it('<Markdown /> component', async () => {
				const html = await fixture.readFile('/astro/index.html');
				const $ = cheerio.load(html);

				expect($('pre')).to.have.lengthOf(1);
				expect($('pre').hasClass('astro-code')).to.equal(true);
				expect($('pre').attr().style).to.equal('background-color: #FDFDFE; overflow-x: auto;');
			});
		});
	});

	describe('Custom langs', () => {
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				projectRoot: './fixtures/astro-markdown-shiki/langs/',
				markdownOptions: {
					render: [
						markdownRemark,
						{
							syntaxHighlight: 'shiki',
							shikiConfig: {
								langs: [
									{
										id: 'rinfo',
										scopeName: 'source.rinfo',
										grammar: riGrammar,
										aliases: ['ri'],
									},
								],
							},
						},
					],
				},
				buildOptions: {
					sitemap: false,
				},
			});
			await fixture.build();
		});

		it('Markdown file', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			const segments = $('.line').get(6).children;
			expect(segments).to.have.lengthOf(3);
			expect(segments[0].attribs.style).to.be.equal('color: #C9D1D9');
			expect(segments[1].attribs.style).to.be.equal('color: #79C0FF');
			expect(segments[2].attribs.style).to.be.equal('color: #C9D1D9');
		});

		it('<Markdown /> component', async () => {
			const html = await fixture.readFile('/astro/index.html');
			const $ = cheerio.load(html);

			const segments = $('.line').get(6).children;
			expect(segments).to.have.lengthOf(2);
			expect(segments[0].attribs.style).to.be.equal('color: #79C0FF');
			expect(segments[1].attribs.style).to.be.equal('color: #C9D1D9');
		});
	});

	describe('Wrap', () => {
		describe('wrap = true', () => {
			const style = 'background-color: #0d1117; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;';
			let fixture;

			before(async () => {
				fixture = await loadFixture({
					projectRoot: './fixtures/astro-markdown-shiki/regular/',
					markdownOptions: {
						render: [markdownRemark, { syntaxHighlight: 'shiki', shikiConfig: { wrap: true } }],
					},
					buildOptions: {
						sitemap: false,
					},
				});
				await fixture.build();
			});

			it('Markdown file', async () => {
				const html = await fixture.readFile('/index.html');
				const $ = cheerio.load(html);

				expect($('pre')).to.have.lengthOf(1);
				expect($('pre').attr('style')).to.equal(style);
			});

			it('<Markdown /> component', async () => {
				const html = await fixture.readFile('/astro/index.html');
				const $ = cheerio.load(html);

				expect($('pre').get(0).attribs.style).to.equal(style);
				expect($('pre').get(1).attribs.style).to.equal(style);
			});
		});
	});

	describe('wrap = false', () => {
		const style = 'background-color: #0d1117; overflow-x: auto;';
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				projectRoot: './fixtures/astro-markdown-shiki/regular/',
				markdownOptions: {
					render: [markdownRemark, { syntaxHighlight: 'shiki', shikiConfig: { wrap: false } }],
				},
				buildOptions: {
					sitemap: false,
				},
			});
			await fixture.build();
		});

		it('Markdown file', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('pre')).to.have.lengthOf(1);
			expect($('pre').attr('style')).to.equal(style);
		});

		it('<Markdown /> component', async () => {
			const html = await fixture.readFile('/astro/index.html');
			const $ = cheerio.load(html);

			expect($('pre').get(0).attribs.style).to.equal(style);
			expect($('pre').get(1).attribs.style).to.equal(style);
		});
	});

	describe('wrap = null', () => {
		const style = 'background-color: #0d1117';
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				projectRoot: './fixtures/astro-markdown-shiki/regular/',
				markdownOptions: {
					render: [markdownRemark, { syntaxHighlight: 'shiki', shikiConfig: { wrap: null } }],
				},
				buildOptions: {
					sitemap: false,
				},
			});
			await fixture.build();
		});

		it('Markdown file', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);

			expect($('pre')).to.have.lengthOf(1);
			expect($('pre').attr('style')).to.equal(style);
		});

		it('<Markdown /> component', async () => {
			const html = await fixture.readFile('/astro/index.html');
			const $ = cheerio.load(html);

			expect($('pre').get(0).attribs.style).to.equal(style);
			expect($('pre').get(1).attribs.style).to.equal(style);
		});
	});
});

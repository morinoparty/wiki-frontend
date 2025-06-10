"use client";

import { IS_HIGHLIGHT, applyFormat$, currentFormat$, useTranslation } from "@mdxeditor/editor";
import { MultipleChoiceToggleGroup } from "@mdxeditor/editor";
import { useCellValues, usePublisher } from "@mdxeditor/gurx";
import { Highlighter } from "lucide-react";
import { FC } from "react";

const HighlightToggle: FC = () => {
  const [currentFormat] = useCellValues(currentFormat$);
  const applyFormat = usePublisher(applyFormat$);
  const t = useTranslation();
  const highlightOn = (currentFormat & IS_HIGHLIGHT) !== 0;
  const title = highlightOn
    ? t("toolbar.removeHighlight", "Remove highlight")
    : t("toolbar.highlight", "Highlight");
  return (
    <MultipleChoiceToggleGroup
      items={[{
        title,
        contents: <Highlighter size={16} />,
        active: highlightOn,
        onChange: applyFormat.bind(null, "highlight"),
      }]}
    />
  );
};

export default HighlightToggle;

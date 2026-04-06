import { RefObject, useEffect } from 'react';
import { Article } from '../utils/fetchArticle';

interface FocusTitleOnLoadOptions {
  article: Article | null;
  titleRef: RefObject<HTMLDivElement | null>;
}

export const useFocusTitleOnLoad = ({ article, titleRef }: FocusTitleOnLoadOptions) => {
  useEffect(() => {
    if (article && titleRef.current) {
      // Small delay to let dangerouslySetInnerHTML finish rendering
      const timer = setTimeout(() => {
        titleRef.current?.focus();

        // Move cursor to end of title
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(titleRef.current!);
        range.collapse(false); // false = collapse to end
        sel?.removeAllRanges();
        sel?.addRange(range);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [article]);
};

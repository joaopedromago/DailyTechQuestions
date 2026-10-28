import React from 'react';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { textStyle } from './styles';

type ITextProps = React.ComponentProps<'span'> &
  VariantProps<typeof textStyle> & { numberOfLines?: number };

const Text = React.forwardRef<React.ComponentRef<'span'>, ITextProps>(function Text(
  {
    className,
    isTruncated,
    bold,
    underline,
    strikeThrough,
    size = 'md',
    sub,
    italic,
    highlight,
    numberOfLines,
    style,
    ...props
  }: { className?: string } & ITextProps,
  ref,
) {
  const lineClampStyle: React.CSSProperties | undefined =
    typeof numberOfLines === 'number' && numberOfLines > 0
      ? {
          ...style,
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical' as const,
          WebkitLineClamp: numberOfLines,
          overflow: 'hidden',
        }
      : style;

  return (
    <span
      className={textStyle({
        isTruncated: isTruncated as boolean,
        bold: bold as boolean,
        underline: underline as boolean,
        strikeThrough: strikeThrough as boolean,
        size,
        sub: sub as boolean,
        italic: italic as boolean,
        highlight: highlight as boolean,
        class: className,
      })}
      style={lineClampStyle}
      {...props}
      ref={ref}
    />
  );
});

Text.displayName = 'Text';

export { Text };

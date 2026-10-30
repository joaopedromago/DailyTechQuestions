import React, { type CSSProperties } from 'react';
import { Light as SyntaxHighlighter, type SyntaxHighlighterProps } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import atomOneDarkReasonable from 'react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark-reasonable';
import atomOneLight from 'react-syntax-highlighter/dist/esm/styles/hljs/atom-one-light';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';

SyntaxHighlighter.registerLanguage('javascript', javascript);

type ColorScheme = 'light' | 'dark' | null | undefined;
type RendererProps = NonNullable<SyntaxHighlighterProps['renderer']> extends (
  props: infer Props,
) => unknown
  ? Props
  : never;
type RendererNode = RendererProps['rows'][number];
type HighlightTheme = Record<string, CSSProperties>;

type JavaScriptCodeBlockProps = {
  code: string;
  colorScheme: ColorScheme;
};

function getTokenStyle(className: unknown, theme: HighlightTheme): TextStyle | null {
  if (typeof className !== 'string') return null;

  const style = theme[className];
  if (!style) return null;

  return {
    color: typeof style.color === 'string' ? style.color : undefined,
    fontStyle: style.fontStyle === 'italic' ? 'italic' : undefined,
    fontWeight:
      typeof style.fontWeight === 'string'
        ? (style.fontWeight as TextStyle['fontWeight'])
        : undefined,
    textDecorationLine: style.textDecoration === 'underline' ? 'underline' : undefined,
  };
}

function renderTokens(
  nodes: RendererNode[],
  theme: HighlightTheme,
  keyPrefix = 'token',
): React.ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (node.type === 'text') return String(node.value ?? '');

    const tokenStyles = (node.properties?.className ?? [])
      .map((className) => getTokenStyle(className, theme))
      .filter((style): style is TextStyle => style !== null);

    return (
      <Text key={key} style={StyleSheet.flatten(tokenStyles)}>
        {renderTokens(node.children ?? [], theme, key)}
      </Text>
    );
  });
}

export function JavaScriptCodeBlock({ code, colorScheme }: JavaScriptCodeBlockProps) {
  const theme = colorScheme === 'dark' ? atomOneDarkReasonable : atomOneLight;
  const isDark = colorScheme === 'dark';
  const baseColor = theme.hljs.color;
  const highlighterStyle = {
    hljs: {
      background: 'transparent',
      color: baseColor,
    },
  };

  const renderer: NonNullable<SyntaxHighlighterProps['renderer']> = ({ rows }) => (
    <Text
      selectable
      style={{
        color: typeof baseColor === 'string' ? baseColor : isDark ? '#abb2bf' : '#383a42',
        fontFamily: 'monospace',
        fontSize: 14,
        lineHeight: 20,
        flexShrink: 1,
      }}
    >
      {renderTokens(rows, theme)}
    </Text>
  );

  return (
    <View
      accessibilityLabel="JavaScript code"
      style={{
        width: '100%',
        borderWidth: 1,
        borderColor: isDark ? '#3b4048' : '#e1e4e8',
        borderRadius: 8,
        backgroundColor: theme.hljs.background,
        padding: 12,
      }}
    >
      <SyntaxHighlighter
        language="javascript"
        style={highlighterStyle}
        wrapLongLines
        PreTag={View}
        CodeTag={View}
        renderer={renderer}
      >
        {code}
      </SyntaxHighlighter>
    </View>
  );
}

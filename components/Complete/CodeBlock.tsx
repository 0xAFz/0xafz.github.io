import React from 'react';
import Highlight, { defaultProps } from 'prism-react-renderer';
import vsDarkTheme from 'prism-react-renderer/themes/vsDark';
import styled from 'styled-components';
import rangeParser from 'parse-numeric-range';

const calculateLinesToHighlight = (meta: string) => {
  const RE = /{([\d,-]+)}/;
  if (RE.test(meta)) {
    const strlineNumbers = RE.exec(meta)![1];
    const lineNumbers = rangeParser(strlineNumbers);
    return (index: any) => lineNumbers.includes(index + 1);
  } else {
    return () => false;
  }
};
const shouldLineNumbersRender = (meta: string) => {
  const RE = /line|ln/;
  return RE.test(meta);
};

//USE default JS TEMPLATE
const defaultClassName = 'js';

const PrismWrapper: React.FC<any> = (props) => {
  const { className } = props.children.props;
  // regex info: see https://stackoverflow.com/questions/4607745/split-string-only-on-first-instance-of-specified-character
  const [_, fullMeta] = className.split(/-(.*)/s);
  const [language = defaultClassName, meta] = fullMeta.split(/-(.*)/s);
  const showLineNumbers = shouldLineNumbersRender(meta);
  const shouldHighlightLine = calculateLinesToHighlight(meta);

  return (
    <Highlight
      {...defaultProps}
      code={props.children.props.children.trim()}
      language={language}
      theme={vsDarkTheme}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => {
        return (
          <Pre className={className} style={style} isNumbered={showLineNumbers}>
            {tokens.map((line, i) => {
              const lineProps = getLineProps({
                line,
                key: i,
              });
              if (shouldHighlightLine(i)) {
                lineProps.className = `${lineProps.className} highlight-line`;
              }
              return (
                <Line key={i} {...lineProps}>
                  {showLineNumbers && <LineNo>{i + 1}</LineNo>}
                  <LineContent>
                    {line.map((token, key) => (
                      <span
                        key={key}
                        {...getTokenProps({
                          token,
                          key,
                        })}
                      />
                    ))}
                  </LineContent>
                </Line>
              );
            })}
          </Pre>
        );
      }}
    </Highlight>
  );
};
const Pre = styled.pre<{ isNumbered: boolean }>`
  font-family: Consolas, Menlo, Monaco, source-code-pro, Courier New, monospace;
  font-size: 0.8rem;
  text-align: left;
  padding: ${(props) => (props.isNumbered ? '1rem 0' : '1rem')};
  margin: 1rem -0.5rem 1rem -0.5rem;
  overflow: auto;
  border-radius: var(--radius);
  @media all and (max-width: 768px) {
    border-radius: 0;
  }

  .highlight-line {
    background-color: rgb(53, 59, 69);
  }
  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.4);
    border-radius: 4px;
  }
`;

const Line = styled.div`
  width: 100%;
  @media all and (max-width: 768px) {
    display: table-row;
  }
`;

const LineNo = styled.span`
  display: table-cell;
  text-align: right;
  padding: 0 1em;
  user-select: none;
  opacity: 0.5;
`;

const LineContent = styled.span`
  display: table-cell;
`;
export default PrismWrapper;

interface ConversionOptions {
  preserveWhitespace?: boolean;
  addReactImport?: boolean;
  componentName?: string;
}

class HTMLToJSXConverter {
  private options: ConversionOptions;

  constructor(options: ConversionOptions = {}) {
    this.options = {
      preserveWhitespace: false,
      addReactImport: true,
      componentName: 'Component',
      ...options
    };
  }

  convert(html: string): string {
    // Parse HTML into DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract body content or use the entire document
    const rootElement = doc.body.children.length > 0 ? doc.body : doc.documentElement;
    
    let jsxContent = '';
    
    // Convert each child element
    for (let i = 0; i < rootElement.children.length; i++) {
      jsxContent += this.convertElement(rootElement.children[i] as Element);
    }
    
    // Wrap in React component if requested
    if (this.options.componentName) {
      const reactImport = this.options.addReactImport ? "import React from 'react';\n\n" : '';
      return `${reactImport}const ${this.options.componentName} = () => {
  return (
    <>
${this.indentContent(jsxContent, 6)}
    </>
  );
};

export default ${this.options.componentName};`;
    }
    
    return jsxContent;
  }

  private convertElement(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    const attributes = this.convertAttributes(element);
    const children = this.convertChildren(element);
    
    // Self-closing tags
    if (this.isSelfClosingTag(tagName)) {
      return `<${tagName}${attributes} />`;
    }
    
    // Regular tags
    if (children.trim()) {
      return `<${tagName}${attributes}>\n${children}</${tagName}>`;
    } else {
      return `<${tagName}${attributes}></${tagName}>`;
    }
  }

  private convertAttributes(element: Element): string {
    const attributes: string[] = [];
    
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      const jsxAttr = this.convertAttribute(attr.name, attr.value);
      if (jsxAttr) {
        attributes.push(jsxAttr);
      }
    }
    
    return attributes.length > 0 ? ' ' + attributes.join(' ') : '';
  }

  private convertAttribute(name: string, value: string): string {
    // Convert HTML attributes to JSX attributes
    const attributeMap: { [key: string]: string } = {
      'class': 'className',
      'for': 'htmlFor',
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'maxlength': 'maxLength',
      'cellpadding': 'cellPadding',
      'cellspacing': 'cellSpacing',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable',
      'crossorigin': 'crossOrigin',
      'datetime': 'dateTime',
      'enctype': 'encType',
      'formaction': 'formAction',
      'formenctype': 'formEncType',
      'formmethod': 'formMethod',
      'formnovalidate': 'formNoValidate',
      'formtarget': 'formTarget',
      'novalidate': 'noValidate',
      'radiogroup': 'radioGroup',
      'spellcheck': 'spellCheck',
      'srcdoc': 'srcDoc',
      'srclang': 'srcLang',
      'srcset': 'srcSet',
      'autoplay': 'autoPlay',
      'autofocus': 'autoFocus',
      'autoComplete': 'autoComplete',
      'capture': 'capture',
      'itemid': 'itemID',
      'itemprop': 'itemProp',
      'itemref': 'itemRef',
      'itemscope': 'itemScope',
      'itemtype': 'itemType',
      'nonce': 'nonce',
      'security': 'security',
      'unselectable': 'unselectable',
      'inputmode': 'inputMode',
      'is': 'is',
      'keyparams': 'keyParams',
      'keytype': 'keyType',
      'marginheight': 'marginHeight',
      'marginwidth': 'marginWidth',
      'prefix': 'prefix',
      'property': 'property',
      'results': 'results',
      'role': 'role',
      'vocab': 'vocab'
    };

    const jsxAttrName = attributeMap[name.toLowerCase()] || name;
    
    // Handle boolean attributes
    if (value === '' || value === name) {
      return jsxAttrName;
    }
    
    // Handle event handlers (convert to camelCase)
    if (name.startsWith('on')) {
      const eventName = 'on' + name.charAt(2).toUpperCase() + name.slice(3);
      return `${eventName}={${value}}`;
    }
    
    // Handle style attribute
    if (name === 'style') {
      const styleObj = this.convertStyleToObject(value);
      return `style={${styleObj}}`;
    }
    
    // Handle data attributes and aria attributes (keep as-is)
    if (name.startsWith('data-') || name.startsWith('aria-')) {
      return `${name}="${this.escapeAttributeValue(value)}"`;
    }
    
    // Regular attributes
    return `${jsxAttrName}="${this.escapeAttributeValue(value)}"`;
  }

  private convertStyleToObject(styleString: string): string {
    const styles = styleString.split(';').filter(s => s.trim());
    const styleObj: { [key: string]: string } = {};
    
    styles.forEach(style => {
      const [property, value] = style.split(':').map(s => s.trim());
      if (property && value) {
        // Convert kebab-case to camelCase
        const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        styleObj[camelProperty] = value;
      }
    });
    
    const styleEntries = Object.entries(styleObj)
      .map(([key, value]) => `${key}: "${value}"`)
      .join(', ');
    
    return `{{ ${styleEntries} }}`;
  }

  private convertChildren(element: Element): string {
    let result = '';
    
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      
      if (child.nodeType === Node.ELEMENT_NODE) {
        result += this.indentContent(this.convertElement(child as Element), 2) + '\n';
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent || '';
        if (this.options.preserveWhitespace || text.trim()) {
          const processedText = this.processTextContent(text);
          if (processedText) {
            result += this.indentContent(processedText, 2) + '\n';
          }
        }
      }
    }
    
    return result;
  }

  private processTextContent(text: string): string {
    // Escape JSX special characters
    let processed = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    // Handle JSX expressions (basic detection)
    if (processed.includes('{') && processed.includes('}')) {
      // This is a simple case - in a real implementation, you'd want more sophisticated parsing
      return `{${processed}}`;
    }
    
    return processed.trim() ? processed : '';
  }

  private escapeAttributeValue(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  private isSelfClosingTag(tagName: string): boolean {
    const selfClosingTags = [
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr'
    ];
    return selfClosingTags.includes(tagName);
  }

  private indentContent(content: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return content.split('\n').map(line => line.trim() ? indent + line : line).join('\n');
  }
}

// Usage example
const converter = new HTMLToJSXConverter({
  componentName: 'MyComponent',
  addReactImport: true,
  preserveWhitespace: false
});

// Example HTML to convert
const htmlString = `
<div class="container">
  <h1 style="color: red; font-size: 24px;">Hello World</h1>
  <p>This is a paragraph with <strong>bold text</strong>.</p>
  <button onclick="handleClick()" type="button">Click me</button>
  <input type="text" placeholder="Enter text" readonly />
  <img src="image.jpg" alt="Description" />
</div>
`;

// Convert and output
const jsxResult = converter.convert(htmlString);
console.log(jsxResult);

// You can also use it without wrapping in a component
const simpleConverter = new HTMLToJSXConverter({ componentName: undefined });
const simpleJsx = simpleConverter.convert('<div class="test">Hello</div>');
console.log('Simple JSX:', simpleJsx);

export { HTMLToJSXConverter, type ConversionOptions };
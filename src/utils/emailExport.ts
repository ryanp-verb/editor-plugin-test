/**
 * Email Export Utility
 * 
 * Converts TipTap HTML to email-safe HTML compatible with:
 * - Windows 10 Outlook (Word rendering engine)
 * - Gmail, Apple Mail, Yahoo
 * - Mobile email clients
 * 
 * Uses table-based layouts for Outlook compatibility
 * and MSO conditionals for responsive columns
 */

export interface EmailExportOptions {
  /** Maximum content width in pixels */
  maxWidth?: number;
  /** Font family stack for email */
  fontFamily?: string;
  /** Base font size */
  fontSize?: string;
  /** Line height */
  lineHeight?: string;
  /** Primary accent color */
  accentColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Text color */
  textColor?: string;
  /** Include full HTML document wrapper */
  fullDocument?: boolean;
}

const defaultOptions: Required<EmailExportOptions> = {
  maxWidth: 600,
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: '16px',
  lineHeight: '1.6',
  accentColor: '#6366f1',
  backgroundColor: '#ffffff',
  textColor: '#333333',
  fullDocument: true,
};

/**
 * Convert TipTap HTML to email-safe HTML
 */
export function convertToEmailHTML(html: string, options: EmailExportOptions = {}): string {
  const opts = { ...defaultOptions, ...options };
  
  // Create a temporary DOM to parse and transform
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;
  
  // Transform elements
  transformColumnLayouts(body, opts);
  transformDivBlocks(body, opts);
  transformHeadings(body, opts);
  transformParagraphs(body, opts);
  transformLists(body, opts);
  transformBlockquotes(body, opts);
  transformCodeBlocks(body, opts);
  transformLinks(body, opts);
  transformImages(body, opts);
  transformTables(body, opts);
  transformHorizontalRules(body, opts);
  
  const innerHTML = body.innerHTML;
  
  if (opts.fullDocument) {
    return wrapInEmailDocument(innerHTML, opts);
  }
  
  return innerHTML;
}

/**
 * Transform column layouts to table-based responsive layout
 */
function transformColumnLayouts(container: HTMLElement, opts: Required<EmailExportOptions>): void {
  const columnLayouts = container.querySelectorAll('[data-type="column-layout"]');
  
  columnLayouts.forEach(layout => {
    const columns = layout.querySelectorAll(':scope > [data-type="column"]');
    const columnCount = columns.length;
    const columnWidth = Math.floor(100 / columnCount);
    const columnWidthPx = Math.floor(opts.maxWidth / columnCount) - 10;
    
    // Create MSO table for Outlook
    const tableHTML = `
<!--[if mso]>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
${Array.from(columns).map((col, i) => `
<td width="${columnWidth}%" valign="top" style="padding: 0 ${i < columnCount - 1 ? '10' : '0'}px 0 ${i > 0 ? '10' : '0'}px;">
${col.innerHTML}
</td>
`).join('')}
</tr>
</table>
<![endif]-->
<!--[if !mso]><!-->
<div style="display: flex; flex-wrap: wrap; margin: 0 -10px;">
${Array.from(columns).map(col => `
<div class="email-column" style="flex: 1 1 ${columnWidthPx}px; min-width: 200px; padding: 0 10px; box-sizing: border-box;">
${col.innerHTML}
</div>
`).join('')}
</div>
<!--<![endif]-->
`;
    
    const wrapper = document.createElement('div');
    wrapper.innerHTML = tableHTML;
    layout.replaceWith(wrapper);
  });
}

/**
 * Transform div blocks to simple table containers
 */
function transformDivBlocks(container: HTMLElement, _opts: Required<EmailExportOptions>): void {
  const divBlocks = container.querySelectorAll('[data-type="div-block"]');
  
  divBlocks.forEach(div => {
    const table = document.createElement('table');
    table.setAttribute('role', 'presentation');
    table.setAttribute('width', '100%');
    table.setAttribute('cellpadding', '0');
    table.setAttribute('cellspacing', '0');
    table.setAttribute('border', '0');
    table.style.cssText = `
      margin: 16px 0;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    `.replace(/\s+/g, ' ').trim();
    
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.style.cssText = 'padding: 16px;';
    td.innerHTML = div.innerHTML;
    
    tr.appendChild(td);
    table.appendChild(tr);
    div.replaceWith(table);
  });
}

/**
 * Transform headings with inline styles
 */
function transformHeadings(container: HTMLElement, opts: Required<EmailExportOptions>): void {
  const headingStyles: Record<string, string> = {
    h1: `font-size: 32px; font-weight: bold; margin: 24px 0 16px 0; line-height: 1.3; color: ${opts.textColor}; font-family: ${opts.fontFamily};`,
    h2: `font-size: 24px; font-weight: bold; margin: 20px 0 12px 0; line-height: 1.3; color: ${opts.textColor}; font-family: ${opts.fontFamily};`,
    h3: `font-size: 20px; font-weight: bold; margin: 16px 0 8px 0; line-height: 1.3; color: ${opts.textColor}; font-family: ${opts.fontFamily};`,
  };
  
  ['h1', 'h2', 'h3'].forEach(tag => {
    container.querySelectorAll(tag).forEach(el => {
      (el as HTMLElement).style.cssText = headingStyles[tag];
    });
  });
}

/**
 * Transform paragraphs with inline styles
 */
function transformParagraphs(container: HTMLElement, opts: Required<EmailExportOptions>): void {
  container.querySelectorAll('p').forEach(p => {
    p.style.cssText = `
      margin: 0 0 16px 0;
      font-size: ${opts.fontSize};
      line-height: ${opts.lineHeight};
      color: ${opts.textColor};
      font-family: ${opts.fontFamily};
    `.replace(/\s+/g, ' ').trim();
  });
  
  // Handle strong/bold
  container.querySelectorAll('strong, b').forEach(el => {
    (el as HTMLElement).style.fontWeight = 'bold';
  });
  
  // Handle italic
  container.querySelectorAll('em, i').forEach(el => {
    (el as HTMLElement).style.fontStyle = 'italic';
  });
  
  // Handle strikethrough
  container.querySelectorAll('s, strike, del').forEach(el => {
    (el as HTMLElement).style.textDecoration = 'line-through';
  });
  
  // Handle inline code
  container.querySelectorAll('code').forEach(el => {
    if (el.closest('pre')) return; // Skip code blocks
    (el as HTMLElement).style.cssText = `
      background-color: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: Consolas, Monaco, 'Courier New', monospace;
      font-size: 14px;
      color: ${opts.accentColor};
    `.replace(/\s+/g, ' ').trim();
  });
}

/**
 * Transform lists to table-based lists for Outlook
 */
function transformLists(container: HTMLElement, opts: Required<EmailExportOptions>): void {
  // Transform unordered lists
  container.querySelectorAll('ul').forEach(ul => {
    if (ul.getAttribute('data-type') === 'taskList') {
      transformTaskList(ul as HTMLUListElement, opts);
      return;
    }
    
    const items = ul.querySelectorAll(':scope > li');
    let tableHTML = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 16px 0;">`;
    
    items.forEach(li => {
      tableHTML += `
        <tr>
          <td width="20" valign="top" style="padding: 4px 8px 4px 0; font-family: ${opts.fontFamily}; font-size: ${opts.fontSize}; color: ${opts.textColor};">•</td>
          <td valign="top" style="padding: 4px 0; font-family: ${opts.fontFamily}; font-size: ${opts.fontSize}; line-height: ${opts.lineHeight}; color: ${opts.textColor};">${li.innerHTML}</td>
        </tr>
      `;
    });
    
    tableHTML += '</table>';
    
    const wrapper = document.createElement('div');
    wrapper.innerHTML = tableHTML;
    ul.replaceWith(wrapper.firstElementChild!);
  });
  
  // Transform ordered lists
  container.querySelectorAll('ol').forEach(ol => {
    const items = ol.querySelectorAll(':scope > li');
    let tableHTML = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 16px 0;">`;
    
    items.forEach((li, i) => {
      tableHTML += `
        <tr>
          <td width="30" valign="top" style="padding: 4px 8px 4px 0; font-family: ${opts.fontFamily}; font-size: ${opts.fontSize}; color: ${opts.textColor};">${i + 1}.</td>
          <td valign="top" style="padding: 4px 0; font-family: ${opts.fontFamily}; font-size: ${opts.fontSize}; line-height: ${opts.lineHeight}; color: ${opts.textColor};">${li.innerHTML}</td>
        </tr>
      `;
    });
    
    tableHTML += '</table>';
    
    const wrapper = document.createElement('div');
    wrapper.innerHTML = tableHTML;
    ol.replaceWith(wrapper.firstElementChild!);
  });
}

/**
 * Transform task lists with checkboxes
 */
function transformTaskList(ul: HTMLUListElement, opts: Required<EmailExportOptions>): void {
  const items = ul.querySelectorAll(':scope > li');
  let tableHTML = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 16px 0;">`;
  
  items.forEach(li => {
    const isChecked = li.getAttribute('data-checked') === 'true';
    const checkbox = isChecked ? '☑' : '☐';
    const textStyle = isChecked ? 'text-decoration: line-through; opacity: 0.6;' : '';
    
    tableHTML += `
      <tr>
        <td width="24" valign="top" style="padding: 4px 8px 4px 0; font-family: ${opts.fontFamily}; font-size: 18px; color: ${opts.accentColor};">${checkbox}</td>
        <td valign="top" style="padding: 4px 0; font-family: ${opts.fontFamily}; font-size: ${opts.fontSize}; line-height: ${opts.lineHeight}; color: ${opts.textColor}; ${textStyle}">${li.querySelector('div, p')?.innerHTML || li.innerHTML}</td>
      </tr>
    `;
  });
  
  tableHTML += '</table>';
  
  const wrapper = document.createElement('div');
  wrapper.innerHTML = tableHTML;
  ul.replaceWith(wrapper.firstElementChild!);
}

/**
 * Transform blockquotes
 */
function transformBlockquotes(container: HTMLElement, opts: Required<EmailExportOptions>): void {
  container.querySelectorAll('blockquote').forEach(bq => {
    const table = document.createElement('table');
    table.setAttribute('role', 'presentation');
    table.setAttribute('width', '100%');
    table.setAttribute('cellpadding', '0');
    table.setAttribute('cellspacing', '0');
    table.setAttribute('border', '0');
    table.style.cssText = 'margin: 16px 0;';
    
    table.innerHTML = `
      <tr>
        <td width="4" style="background-color: ${opts.accentColor};"></td>
        <td style="padding: 12px 16px; font-family: ${opts.fontFamily}; font-size: ${opts.fontSize}; line-height: ${opts.lineHeight}; color: #666666; font-style: italic;">
          ${bq.innerHTML}
        </td>
      </tr>
    `;
    
    bq.replaceWith(table);
  });
}

/**
 * Transform code blocks
 */
function transformCodeBlocks(container: HTMLElement, _opts: Required<EmailExportOptions>): void {
  container.querySelectorAll('pre').forEach(pre => {
    const code = pre.querySelector('code');
    const content = code?.textContent || pre.textContent || '';
    
    const table = document.createElement('table');
    table.setAttribute('role', 'presentation');
    table.setAttribute('width', '100%');
    table.setAttribute('cellpadding', '0');
    table.setAttribute('cellspacing', '0');
    table.setAttribute('border', '0');
    
    table.innerHTML = `
      <tr>
        <td style="background-color: #1e1e1e; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <pre style="margin: 0; font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 14px; line-height: 1.5; color: #d4d4d4; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(content)}</pre>
        </td>
      </tr>
    `;
    
    pre.replaceWith(table);
  });
}

/**
 * Transform links
 */
function transformLinks(container: HTMLElement, opts: Required<EmailExportOptions>): void {
  container.querySelectorAll('a').forEach(a => {
    a.style.cssText = `color: ${opts.accentColor}; text-decoration: underline;`;
    a.setAttribute('target', '_blank');
  });
}

/**
 * Transform images
 */
function transformImages(container: HTMLElement, _opts: Required<EmailExportOptions>): void {
  container.querySelectorAll('img').forEach(imgEl => {
    const img = imgEl as HTMLImageElement;
    img.style.cssText = `
      max-width: 100%;
      height: auto;
      display: block;
      margin: 16px 0;
      border-radius: 8px;
    `.replace(/\s+/g, ' ').trim();
    
    img.setAttribute('border', '0');
  });
}

/**
 * Transform tables
 */
function transformTables(container: HTMLElement, opts: Required<EmailExportOptions>): void {
  container.querySelectorAll('table:not([role="presentation"])').forEach(tableEl => {
    const table = tableEl as HTMLTableElement;
    table.setAttribute('width', '100%');
    table.setAttribute('cellpadding', '0');
    table.setAttribute('cellspacing', '0');
    table.setAttribute('border', '0');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      border: 1px solid #e5e7eb;
    `.replace(/\s+/g, ' ').trim();
    
    table.querySelectorAll('th').forEach(thEl => {
      const th = thEl as HTMLTableCellElement;
      th.style.cssText = `
        padding: 12px;
        text-align: left;
        font-weight: bold;
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        font-family: ${opts.fontFamily};
        font-size: ${opts.fontSize};
        color: ${opts.textColor};
      `.replace(/\s+/g, ' ').trim();
    });
    
    table.querySelectorAll('td').forEach(tdEl => {
      const td = tdEl as HTMLTableCellElement;
      td.style.cssText = `
        padding: 12px;
        border: 1px solid #e5e7eb;
        font-family: ${opts.fontFamily};
        font-size: ${opts.fontSize};
        color: ${opts.textColor};
      `.replace(/\s+/g, ' ').trim();
    });
  });
}

/**
 * Transform horizontal rules
 */
function transformHorizontalRules(container: HTMLElement, _opts: Required<EmailExportOptions>): void {
  container.querySelectorAll('hr').forEach(hr => {
    const table = document.createElement('table');
    table.setAttribute('role', 'presentation');
    table.setAttribute('width', '100%');
    table.setAttribute('cellpadding', '0');
    table.setAttribute('cellspacing', '0');
    table.setAttribute('border', '0');
    
    table.innerHTML = `
      <tr>
        <td style="padding: 24px 0;">
          <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 0;">
        </td>
      </tr>
    `;
    
    hr.replaceWith(table);
  });
}

/**
 * Wrap content in full email document
 */
function wrapInEmailDocument(content: string, opts: Required<EmailExportOptions>): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title></title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    
    /* Responsive */
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-column { 
        display: block !important; 
        width: 100% !important; 
        max-width: 100% !important;
        flex: none !important;
        padding: 10px 0 !important;
      }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${opts.backgroundColor}; font-family: ${opts.fontFamily}; font-size: ${opts.fontSize}; line-height: ${opts.lineHeight}; color: ${opts.textColor};">
  <!--[if mso]>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
  <td align="center">
  <![endif]-->
  
  <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: ${opts.maxWidth}px; margin: 0 auto;">
    <tr>
      <td class="mobile-padding" style="padding: 20px;">
        ${content}
      </td>
    </tr>
  </table>
  
  <!--[if mso]>
  </td>
  </tr>
  </table>
  <![endif]-->
</body>
</html>`;
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Export editor content to email HTML and trigger download
 */
export function downloadEmailHTML(html: string, filename: string = 'email-export.html', options?: EmailExportOptions): void {
  const emailHTML = convertToEmailHTML(html, options);
  const blob = new Blob([emailHTML], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy email HTML to clipboard
 */
export async function copyEmailHTMLToClipboard(html: string, options?: EmailExportOptions): Promise<boolean> {
  const emailHTML = convertToEmailHTML(html, options);
  
  try {
    await navigator.clipboard.writeText(emailHTML);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = emailHTML;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}

const { PDFParse } = require('pdf-parse');

/**
 * Extract text from PDF file with page separation (V2)
 * @param {object} params
 * @param {Buffer} params.fileBuffer - PDF file buffer
 * @returns {Promise<{text: string, numPages: number, pages: string[], info: object}>}
 */
const parseV2 = async (params = {}) => {
  try {
    const { fileBuffer } = params;

    const pages = [];

    // Custom render callback to extract text per page
    const render_page = (pageData) => {
      // check documents https://mozilla.github.io/pdf.js/
      const render_options = {
        //replaces all occurrences of whitespace with standard spaces (0x20). The default value is false.
        normalizeWhitespace: false,
        //do not attempt to combine same line TextItem's. The default value is false.
        disableCombineTextItems: false
      };

      return pageData.getTextContent(render_options)
        .then(function (textContent) {
          let lastY, text = '';
          for (let item of textContent.items) {
            if (lastY == item.transform[5] || !lastY) {
              text += item.str;
            }
            else {
              text += '\n' + item.str;
            }
            lastY = item.transform[5];
          }
          pages.push(text); // Capture the page text
          return text;
        });
    };

    const options = {
      pagerender: render_page
    };

    // pdf-parse expects a Buffer or Uint8Array
    const parser = new PDFParse(new Uint8Array(fileBuffer), options);
    const data = await parser.getText();

    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
      pages: pages
    };

  } catch (error) {
    console.error("PDF parsing error (V2):", error);
    throw new Error("Failed to extract text from PDF");
  }
};

module.exports = { parseV2 };

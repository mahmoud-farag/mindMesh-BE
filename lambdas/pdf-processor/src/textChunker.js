/**
 * Generator function to split text into chunks page by page
 * @param {object} params
 * @param {string[]} params.pages - Array of page texts
 * @param {string} params.text - Full text (fallback if no pages)
 * @param {number} params.chunkSize - Target size per chunk (in words)
 * @param {number} params.overlap - Number of words to overlap between chunks
 * @yields {object} Chunk object with {content, chunkIndex, pageNumber}
 */
function* chunkTextV2(params = {}) {
  const { pages, text, chunkSize = 20, overlap = 5 } = params;

  if (!pages || !Array.isArray(pages) || pages.length === 0) {
    // Fallback: process full text lazily if no pages provided
    const subGenerator = chunkFromFullText({ text, chunkSize, overlap });
    for (const chunk of subGenerator) {
      yield chunk;
    }
    return;
  }

  let chunkIndex = 0;

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageText = pages[pageIdx];
    const pageNumber = pageIdx + 1;

    if (!pageText || pageText.trim().length === 0) continue;

    const cleanedPageText = cleanText(pageText);
    const paragraphs = cleanedPageText.split(/\n+/).filter(p => p.trim().length > 0);

    let currentChunk = [];
    let currentWordCount = 0;

    for (const paragraph of paragraphs) {
      const paragraphWords = paragraph.trim().split(/\s+/);
      const paragraphWordCount = paragraphWords.length;

      // If single paragraph exceeds chunk size, split it by words
      if (paragraphWordCount > chunkSize) {
        if (currentChunk.length > 0) {
          yield {
            content: currentChunk.join('\n\n'),
            chunkIndex: chunkIndex++,
            pageNumber: pageNumber
          };
          currentChunk = [];
          currentWordCount = 0;
        }

        // Split large paragraph into word-based chunks
        for (let i = 0; i < paragraphWords.length; i += (chunkSize - overlap)) {
          const chunkWords = paragraphWords.slice(i, i + chunkSize);
          yield {
            content: chunkWords.join(' '),
            chunkIndex: chunkIndex++,
            pageNumber: pageNumber
          };
          if (i + chunkSize >= paragraphWords.length) break;
        }
        continue;
      }

      // If adding this paragraph exceeds chunk size, save current chunk
      if (currentWordCount + paragraphWordCount > chunkSize && currentChunk.length > 0) {
        yield {
          content: currentChunk.join('\n\n'),
          chunkIndex: chunkIndex++,
          pageNumber: pageNumber,
        };

        // Create overlap from previous chunk
        const prevChunkText = currentChunk.join(' ');
        const prevWords = prevChunkText.split(/\s+/);
        const overlapText = prevWords.slice(-Math.min(overlap, prevWords.length)).join(' ');

        currentChunk = [overlapText, paragraph.trim()];
        currentWordCount = overlapText.split(/\s+/).length + paragraphWordCount;

      } else {
        // Add paragraph to current chunk
        currentChunk.push(paragraph.trim());
        currentWordCount += paragraphWordCount;
      }
    }

    // Add the last chunk of the page
    if (currentChunk.length > 0) {
      yield {
        content: currentChunk.join('\n\n'),
        chunkIndex: chunkIndex++,
        pageNumber: pageNumber
      };
    }
  }
}

/**
 * Generator function to split raw text into chunks (fallback for V2)
 * @param {object} params
 * @param {string} params.text - Full text to chunk
 * @param {number} params.chunkSize - Target size per chunk (in words)
 * @param {number} params.overlap - Number of words to overlap between chunks
 * @yields {object} Chunk object
 */
function* chunkFromFullText(params = {}) {
  const { text, chunkSize = 20, overlap = 5 } = params;

  if (!text || text.trim().length === 0) return;

  const cleanedText = cleanText(text);
  const paragraphs = cleanedText.split(/\n+/).filter(p => p.trim().length > 0);

  let currentChunk = [];
  let currentWordCount = 0;
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = paragraph.trim().split(/\s+/);
    const paragraphWordCount = paragraphWords.length;

    // If single paragraph exceeds chunk size, split it by words
    if (paragraphWordCount > chunkSize) {
      if (currentChunk.length > 0) {
        yield {
          content: currentChunk.join('\n\n'),
          chunkIndex: chunkIndex++,
          pageNumber: 1 // Default to 1
        };
        currentChunk = [];
        currentWordCount = 0;
      }

      // Split large paragraph into word-based chunks
      for (let i = 0; i < paragraphWords.length; i += (chunkSize - overlap)) {
        const chunkWords = paragraphWords.slice(i, i + chunkSize);
        yield {
          content: chunkWords.join(' '),
          chunkIndex: chunkIndex++,
          pageNumber: 1
        };
        if (i + chunkSize >= paragraphWords.length) break;
      }
      continue;
    }

    // If adding this paragraph exceeds chunk size, save current chunk
    if (currentWordCount + paragraphWordCount > chunkSize && currentChunk.length > 0) {
      yield {
        content: currentChunk.join('\n\n'),
        chunkIndex: chunkIndex++,
        pageNumber: 1,
      };

      // Create overlap from previous chunk
      const prevChunkText = currentChunk.join(' ');
      const prevWords = prevChunkText.split(/\s+/);
      const overlapText = prevWords.slice(-Math.min(overlap, prevWords.length)).join(' ');

      currentChunk = [overlapText, paragraph.trim()];
      currentWordCount = overlapText.split(/\s+/).length + paragraphWordCount;
    } else {
      // Add paragraph to current chunk
      currentChunk.push(paragraph.trim());
      currentWordCount += paragraphWordCount;
    }
  }

  // Add the last chunk
  if (currentChunk.length > 0) {
    yield {
      content: currentChunk.join('\n\n'),
      chunkIndex: chunkIndex,
      pageNumber: 1
    };
  }
}

/**
 * Clean text by removing extra whitespace and special characters
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
function cleanText(text) {
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/(?:\.\s*){3,}/g, ' ') // Remove sequences of 3+ dots (leaders)
    .replace(/\s+/g, ' ')
    .replace(/\n /g, '\n')
    .trim();

  return cleanedText;
}

module.exports = { chunkTextV2 };

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  
  if (result.source) {
    const source = result.source.toString();
    if (source.startsWith('\'use client\'') || source.startsWith('"use client"')) {
      // Replace the entire module with a client reference
      const newSource = `
        import { registerClientReference } from 'react-server-dom-webpack/server';
        export default registerClientReference(
          function() { throw new Error('Client component cannot be called on server'); },
          ${JSON.stringify(url)},
          'default'
        );
      `;
      return { ...result, source: newSource };
    }
  }
  
  return result;
}

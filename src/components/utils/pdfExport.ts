export async function exportToPDF(title: string, contentHTML: string): Promise<void> {
    const html2pdf = (await import('html2pdf.js')).default;

    const container = document.createElement('div');
    container.style.cssText = 'padding:48px;font-family:Georgia,serif;font-size:17px;line-height:1.8;color:#1a1714;';

    const h1 = document.createElement('h1');
    h1.innerText = title;
    h1.style.cssText = 'font-family:Georgia,serif;font-size:32px;margin-bottom:32px;';

    container.appendChild(h1);
    container.innerHTML += contentHTML;

    html2pdf()
        .set({
            margin:     12,
            filename:   `${title || 'article'}.pdf`,
            html2canvas: { scale: 2, useCORS: true },
            jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(container)
        .save();
}

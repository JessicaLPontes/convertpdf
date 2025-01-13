async function handlePdfFile(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('Por favor, selecione um arquivo PDF.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function () {
        try {
            const pdfData = new Uint8Array(reader.result);
            const pdfDoc = await PDFLib.PDFDocument.load(pdfData);
            const pages = pdfDoc.getPages();

            const extractedData = [];
            for (const page of pages) {
                const textContent = await page.getTextContent();
                const text = textContent.items.map(item => item.str).join(' ');
                extractedData.push(text);
            }

            generateExcel(extractedData);
        } catch (error) {
            console.error('Erro ao processar o PDF:', error);
            alert('Erro ao processar o PDF.');
        }
    };

    reader.readAsArrayBuffer(file);
}

function generateExcel(data) {
    const ws = XLSX.utils.json_to_sheet(
        data.map((text, index) => ({ Página: index + 1, Conteúdo: text }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PDF_Data');

    const excelData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const linkContainer = document.getElementById('excel-link-container');
    linkContainer.innerHTML = '';

    const link = document.createElement('a');
    link.href = url;
    link.download = 'PDF_to_Excel.xlsx';
    link.textContent = 'Baixar Excel';
    link.classList.add('sql-link');

    linkContainer.appendChild(link);
}

function clearFiles() {
    document.getElementById('pdf-input').value = '';
    document.getElementById('excel-link-container').innerHTML = '';
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const icon = document.querySelector('#theme-toggle i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
}
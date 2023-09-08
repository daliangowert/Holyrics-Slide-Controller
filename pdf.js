const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const striptags = require('striptags');
const os = require('os');
const { exec } = require('child_process');

pdfDoc = null;
page = null;
spaceHeight = null;
marginPage = null;
borderThickness = null;
borderColor = null;
nameArchive = null;

const textParams = [
    { // TitlePrincipal
        name: 'TITLEPRIN',
        x: 0, // definir em tempo de código
        y: 0, // definir em tempo de código
        size: 11,
        color: rgb(0, 0, 0),
        font: null, // definir em tempo de código
        lineHeight: 1.25 * 11 //1.25 * size
    },
    { // Title
        name: 'TITLE',
        x: 50,
        y: 0, // definir em tempo de código
        size: 10,
        color: rgb(0, 0, 0),
        font: null, // definir em tempo de código
        lineHeight: 1.25 * 10 //1.25 * size
    },
    { // Regular
        name: 'REGULAR',
        x: 65,
        y: 0, // definir em tempo de código
        size: 9,
        color: rgb(0, 0, 0),
        font: null, // definir em tempo de código
        lineHeight: 1.25 * 9 //1.25 * size
    },
    { // Regular
        name: 'REGULAR_BOLD',
        x: 65,
        y: 0, // definir em tempo de código
        size: 9,
        color: rgb(0, 0, 0),
        font: null, // definir em tempo de código
        lineHeight: 1.25 * 9 //1.25 * size
    }
];

async function initDocumentPDF(margPage, borderTckn, borderCol, nmeArchive) {
    // Cria objeto PDF
    pdfDoc = await PDFDocument.create();
    page = pdfDoc.addPage();

    spaceHeight = page.getHeight() - marginPage;
    marginPage = margPage;
    borderThickness = borderTckn;
    borderColor = borderCol;
    nameArchive = nmeArchive;
}

async function verifyPDFisOpen() {
    tempDir = await createDirectory();
    pdfBytes = Buffer.from('%PDF-1.5\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\nBT\n/F1 12 Tf\n100 100 Td\n(Hello, PDF!) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000070 00000 n \n0000000119 00000 n \n0000000175 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n211\n%%EOF', 'utf-8');


    try {
        // Salva o PDF em um arquivo
        await fs.writeFile(tempDir + nameArchive + '.pdf', pdfBytes);
    } catch (error) {
        console.error('Ocorreu um erro ao escrever o arquivo:', error);
        return {'status': 'error', error};
    }

    return {'status': 'ok'};
}

async function createDirectory() {
    tempDir = os.tmpdir() + '/Holyrics Slide Controller/';

    try {
        // Crie o diretório se ele não existir
        await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
        // Trate qualquer erro de criação do diretório
        console.error(`Erro ao criar o diretório: ${error}`);
    }

    return tempDir;
}

async function organizeTextPDF(text, params) {
    switch (params.name) {
        case 'TITLEPRIN':
            params.font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            spaceHeight -= params.size;
            break;
        case 'TITLE':
            params.font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            spaceHeight -= params.size;
            text = " • " + text.toUpperCase();
            break;
        case 'REGULAR':
            params.font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            break;
        case 'REGULAR_BOLD':
            params.font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            break;
        default:
            break;
    }

    const countLinhas = (striptags(text).match(/\n/g) || []).length + 1;

    if (spaceHeight - (countLinhas * params.lineHeight) < marginPage ||
        (/TITLE|TITLEPRIN/.test(params.name) && spaceHeight - (countLinhas * params.lineHeight) < 3 * marginPage)) {
        console.log("NOVA PÁGINA");
        page = pdfDoc.addPage();
        spaceHeight = page.getHeight() - marginPage;
    }

    const lines = striptags(text).split('\n');
    for (let i = 0; i < lines.length; i++) {
        linha = lines[i];
        linhaWidht = params.font.widthOfTextAtSize(linha, params.size);

        // Verifica se a linha é apenas espaços em branco
        //if (!/^\s*$/.test(linha)) {
        if (/TITLEPRIN/.test(params.name)) {
            params.x = (page.getWidth() - linhaWidht) / 2;
        }

        const xPosition = params.x;
        params.y = spaceHeight;

        if (linhaWidht + xPosition + marginPage <= page.getWidth()) {
            await drawText(linha, params);
            spaceHeight -= params.lineHeight;
        } else {
            let posIni = 0;
            let spaceDisp = page.getWidth() - marginPage - xPosition;

            while (linhaWidht + xPosition + marginPage > page.getWidth()) {
                const posBreak = breakText(linha, linhaWidht, spaceDisp);
                await drawText(linha.substring(posIni, posBreak), params);
                spaceHeight -= params.lineHeight;
                params.y = spaceHeight;

                linha = linha.substring(posBreak + 1);
                linhaWidht = params.font.widthOfTextAtSize(linha, params.size);
                posIni = posBreak;
            }

            if (linhaWidht > 0) {
                await drawText(linha, params);
                spaceHeight -= params.lineHeight;
                params.y = spaceHeight;
            }
        }
        //}
    }

    if (/TITLE|TITLEPRIN/.test(params.name))
        spaceHeight -= 0.2 * params.size;
    else
        spaceHeight -= 0.5 * params.size;
}

function breakText(lin, linWidth, spaceDisp) {
    posCorte = Math.floor(spaceDisp / (linWidth / lin.length));

    linCorte = lin.substring(0, posCorte);

    pos = posCorte;
    while (!/[.,!?; ]/.test(linCorte[pos]) && pos >= 0) {
        pos--;
    }

    return pos;
}

async function drawText(text, params) {
    const {
        x,
        y,
        size,
        color,
        font,
        lineHeight
    } = params;

    page.drawText(text, {
        x,
        y,
        size,
        color,
        font,
        lineHeight
    });
}

async function drawPhoto(base64JPEG, width, height) {
    const imageBytes = Buffer.from(base64JPEG, 'base64');
    const image = await pdfDoc.embedJpg(imageBytes);
    const imageSize = image.scale(width, height);

    if ((spaceHeight - imageSize.height) < marginPage) {
        console.log("NOVA PÁGINA");
        page = pdfDoc.addPage();
        spaceHeight = page.getHeight() - marginPage;
    }

    page.drawImage(image, {
        x: 65,
        y: spaceHeight - imageSize.height,
        width: imageSize.width,
        height: imageSize.height,
        rotate: degrees(0),
    });

    page.drawRectangle({
        x: 65 - borderThickness / 2,
        y: spaceHeight - imageSize.height - borderThickness / 2,
        width: imageSize.width + borderThickness,
        height: imageSize.height + borderThickness,
        borderColor: borderColor,
        borderWidth: borderThickness,
        opacity: 1, // Opacidade da borda (100% neste exemplo)
    });

    spaceHeight -= imageSize.height + 2 * textParams[2].size;
}

async function saveDocumentPDF() {
    console.log("Salvando PDF...")

    const pdfBytes = await pdfDoc.save();

    tempDir = await createDirectory();

    // Salva o PDF em um arquivo
    await fs.writeFile(tempDir + nameArchive + '.pdf', pdfBytes);

    exec(`start "" "${tempDir}"`);
}

// Exportar funções
module.exports = {
    initDocumentPDF: initDocumentPDF,
    verifyPDFisOpen: verifyPDFisOpen,
    organizeTextPDF: organizeTextPDF,
    saveDocumentPDF: saveDocumentPDF,
    drawPhoto: drawPhoto,
    textParams: textParams
};
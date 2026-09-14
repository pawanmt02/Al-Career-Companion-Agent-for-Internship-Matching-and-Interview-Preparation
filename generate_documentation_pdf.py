from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import textwrap

source = Path('DOCUMENT_STRUCTURE.md')
out_pdf = Path('documentation.pdf')

text = source.read_text(encoding='utf-8')
lines = text.splitlines()

c = canvas.Canvas(str(out_pdf), pagesize=letter)
left = 52
page_width, page_height = letter

c.setTitle('AI Career Companion Agent for Internship Matching and Interview Preparation')
c.setAuthor('AI Career Companion Agent')

# Title block
c.setFillColorRGB(0.12, 0.18, 0.35)
c.setFont('Helvetica-Bold', 21)
c.drawString(left, page_height - 78, 'AI Career Companion Agent')
c.setFont('Helvetica-Bold', 16)
c.drawString(left, page_height - 106, 'for Internship Matching and Interview Preparation')
c.setStrokeColorRGB(0.25, 0.35, 0.55)
c.setLineWidth(1.2)
c.line(left, page_height - 128, page_width - 52, page_height - 128)

c.setFillColorRGB(0, 0, 0)
c.setFont('Helvetica', 10)
y = page_height - 150

main_sections = {
    '1. Overview',
    '2. Project Objectives',
    '3. System Features',
    '4. Technology Stack',
    '5. Application Architecture',
    '6. Resume Parsing Workflow',
    '7. Recommended Resume Structure',
    '8. Document Q&A Workflow',
    '9. Internship Match Process',
    '10. User Profile Auto-Fill',
    '11. Resume Analysis and Feedback',
    '12. Security and Data Handling',
    '13. Project Folder Structure',
    '14. Operational Workflow',
    '15. Conclusion'
}

subsections = {
    'Project Objectives',
    'System Features',
    'Technology Stack',
    'Application Architecture',
    'Resume Parsing Workflow',
    'Recommended Resume Structure',
    'Document Q&A Workflow',
    'Internship Match Process',
    'User Profile Auto-Fill',
    'Resume Analysis and Feedback',
    'Security and Data Handling',
    'Project Folder Structure',
    'Operational Workflow',
    'Conclusion'
}

for raw_line in lines:
    line = raw_line.rstrip()
    if not line.strip():
        y -= 10
        continue

    # sanitize stray punctuation
    line = line.replace('?', '').replace('“', '').replace('”', '')

    if line in main_sections:
        if y < 78:
            c.showPage()
            y = page_height - 60
        c.setFont('Helvetica-Bold', 12)
        c.drawString(left, y, line)
        y -= 18
        c.setFont('Helvetica', 10)
        continue

    if line in subsections:
        if y < 78:
            c.showPage()
            y = page_height - 60
        c.setFont('Helvetica-Bold', 11)
        c.drawString(left, y, line)
        y -= 16
        c.setFont('Helvetica', 10)
        continue

    if line in {'Backend', 'AI and Data Processing', 'Frontend'}:
        if y < 78:
            c.showPage()
            y = page_height - 60
        c.setFont('Helvetica-Bold', 10)
        c.drawString(left, y, line)
        y -= 14
        c.setFont('Helvetica', 10)
        continue

    if line.startswith('- '):
        bullet_text = '• ' + line[2:]
        if y < 76:
            c.showPage()
            y = page_height - 60
        wrapped = textwrap.wrap(bullet_text, width=94)
        for part in wrapped:
            if y < 70:
                c.showPage()
                y = page_height - 60
            c.drawString(left + 12, y, part)
            y -= 12
        continue

    if line.startswith('1. ') or line.startswith('2. ') or line.startswith('3. ') or line.startswith('4. ') or line.startswith('5. ') or line.startswith('6. ') or line.startswith('7. ') or line.startswith('8. '):
        if y < 78:
            c.showPage()
            y = page_height - 60
        c.setFont('Helvetica-Bold', 10)
        c.drawString(left, y, line)
        y -= 14
        c.setFont('Helvetica', 10)
        continue

    wrapped = textwrap.wrap(line, width=100)
    for part in wrapped:
        if y < 70:
            c.showPage()
            y = page_height - 60
        c.drawString(left, y, part)
        y -= 12

c.save()
print(f'Generated {out_pdf.name} successfully')

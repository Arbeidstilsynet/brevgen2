using System.Reflection;
using Aspose.Words;

namespace Brevgenerator
{
    internal static class AsposeWordsLisensAdmin
    {
        public static void SettAsposeWordLisens()
        {
            const string FILSTI = "Brevgenerator.Aspose.Aspose.Words.lic";
            var lisensFilStream = Assembly.GetExecutingAssembly().GetManifestResourceStream(FILSTI);

            if (lisensFilStream == null)
            {
                throw new ArgumentException("Lisensen til Aspose Words ble ikke funnet");
            }

            var lisens = new License();
            lisens.SetLicense(lisensFilStream);
        }

        public static bool PdfDocumentErLisensiert(Document doc)
        {
            return !doc.Range.Text.Contains("Evaluation Only");
        }

        public static bool DocxDocumentErLisensiert(Document doc)
        {
            return !doc.FirstSection.Body.FirstParagraph.Range.Text.Contains("Evaluation Only");
        }

        public static bool ErLisensSatt()
        {
            //https://forum.aspose.com/t/check-to-see-if-aspose-words-is-licensed/49211

            // We will insert this text at the beggining of the document.
            // If the license set this text will be in the first paragraph
            // if not an evaluation watermark will be in the first paragraph.

            const string TEXT = "This is text used to check if the license is set";
            var doc = new Document();
            var builder = new DocumentBuilder(doc);
            builder.Write(TEXT);

            // Save and open the document. If Aspose.Words works in evaluation mode it will add a watermark.
            using (var docStream = new MemoryStream())
            {
                doc.Save(docStream, SaveFormat.Docx);
                docStream.Position = 0;
                doc = new Document(docStream);
            }
            // Check text of the first paragraph.
            return doc.FirstSection.Body.FirstParagraph.Range.Text.Trim() == TEXT;
        }
    }
}

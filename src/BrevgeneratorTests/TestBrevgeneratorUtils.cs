using System.Reflection;
using System.Text.Json;
using Brevgenerator;

namespace BrevgeneratorTests
{
    public class TestBrevgeneratorUtils
    {
        private static readonly JsonSerializerOptions _serializerOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        [Fact]
        public void FlettedataFungerer()
        {
            var testdata = "[{\"navn\": \"Orgnummer\", \"verdi\": \"123456789\"}, { \"navn\": \"Orgnavn\", \"verdi\": \"Test Org\"}]";

            var flettedatafelt = JsonSerializer.Deserialize<List<FlettedataFelt>>(testdata, _serializerOptions);
            var result = Flettedata.FlettedataToDictString(flettedatafelt);

            Assert.NotNull(result);
        }

        [Fact]
        public void FlettedataFungererMedIngenFlettedata()
        {
            var testdata = @"{
                    ""brevmal"": ""brevmal/er/en/nøkkel""
                }";

            var deser = JsonSerializer.Deserialize<WorkerRequest>(testdata, _serializerOptions);

            Assert.Null(deser!.Flettedata);
        }

        [Fact]
        public void FlettedataFungererMedTomFlettedataListe()
        {
            var testdata = @"{
                    ""brevmal"": ""brevmal/er/en/nøkkel.docx"",
                    ""flettedata"": []
                }";

            var deser = JsonSerializer.Deserialize<WorkerRequest>(testdata, _serializerOptions);

            var flettedata = Flettedata.FlettedataToDictString(deser!.Flettedata);

            Assert.False(string.IsNullOrEmpty(flettedata));
        }

        [Fact]
        public void HenterFilLokalt()
        {
            var filsti = "BrevgeneratorTests.nb-testdokument.docx";
            var file = Assembly.GetExecutingAssembly().GetManifestResourceStream(filsti);

            Assert.NotNull(file);
        }

        [Fact]
        public void LagQrKode()
        {
            var result = Utils.LagQrKodeBitmap("https://www.vg.no/");

            Assert.NotNull(result);
        }
    }
}

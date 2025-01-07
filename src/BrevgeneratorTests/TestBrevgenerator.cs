using System.Net;
using System.Reflection;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.S3;
using Amazon.S3.Model;
using Moq;

namespace BrevgeneratorTests
{
    public class TestBrevgenerator : IAsyncLifetime
    {
        private const string DUMMY_FIL = "BrevgeneratorTests.nb-testdokument.docx";

        private Brevgenerator.Brevgenerator _brevgenerator;
        private Mock<ILambdaContext> _context;

        public Task InitializeAsync()
        {
            var s3Mock = new Mock<IAmazonS3>();

            s3Mock
                .Setup(s => s.GetObjectAsync(It.IsAny<string>(), It.IsAny<string>(), default))
                .ReturnsAsync(
                    new GetObjectResponse()
                    {
                        ResponseStream = Assembly.GetExecutingAssembly().GetManifestResourceStream(DUMMY_FIL)
                    }
                );

            s3Mock
                .Setup(s3 => s3.ListObjectsV2Async(It.IsAny<ListObjectsV2Request>(), default))
                .ReturnsAsync(new ListObjectsV2Response { });

            _context = new Mock<ILambdaContext>();
            _context.Setup(l => l.Logger.Log(It.IsAny<string>()));

            _brevgenerator = new Brevgenerator.Brevgenerator("bucket-ikke-i-bruk", s3Mock.Object);

            return Task.CompletedTask;
        }

        public Task DisposeAsync() => Task.CompletedTask;

        [Fact]
        public async Task OKUtenQrKode()
        {
            var body =
                @"{
                ""brevmal"": ""dat/dokumentmaler/asbest/4-nb-bekreftelse-mottat-asbest-melding.docx"",
                ""flettedata"": [
                    { ""navn"": ""Organisasjonsnummer"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Dato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Saksnummer"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Virksomhetsnavn"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Gateadresse"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Postnr"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Poststed"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Jobbadresse"", ""verdi"": ""123456789"" },
                    { ""navn"": ""StartDato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""SluttDato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""TypeArbeid"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Mottatt"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Saksbehandler"", ""verdi"": ""123456789"" }
                ]
            }";

            var response = await Execute(body);

            Assert.NotNull(response.Body);
            Assert.Equal((int)HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task OKUtenFlettedata()
        {
            var body =
                @"{
                ""brevmal"": ""dat/dokumentmaler/asbest/4-nb-bekreftelse-mottat-asbest-melding.docx""
            }";

            var response = await Execute(body);

            Assert.NotNull(response.Body);
            Assert.Equal((int)HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task FeilerMedIngenInput()
        {
            var body = @"";

            var response = await Execute(body);

            Assert.NotNull(response.Body);
            Assert.Equal((int)HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task FeilerMedManglendeMalIVarmOpp()
        {
            var body = @"";

            var response = await _brevgenerator.FunctionHandler(
                new APIGatewayProxyRequest() { Body = body, Path = "varmopp", },
                _context.Object
            );

            Assert.NotNull(response.Body);
            Assert.Equal((int)HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task OKMedTomFlettedata()
        {
            var body =
                @"{
                ""brevmal"": ""dat/dokumentmaler/asbest/4-nb-bekreftelse-mottat-asbest-melding.docx"",
                ""flettedata"": []
            }";

            var response = await Execute(body);

            Assert.NotNull(response.Body);
            Assert.Equal((int)HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task FeilerMedTomQRKode()
        {
            var body =
                @"{
                ""brevmal"": ""dat/dokumentmaler/asbest/4-nb-bekreftelse-mottat-asbest-melding.docx"",
                ""flettedata"": [
                    { ""navn"": ""Organisasjonsnummer"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Dato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Saksnummer"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Virksomhetsnavn"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Gateadresse"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Postnr"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Poststed"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Jobbadresse"", ""verdi"": ""123456789"" },
                    { ""navn"": ""StartDato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""SluttDato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""TypeArbeid"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Mottatt"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Saksbehandler"", ""verdi"": ""123456789"" }
                ],
                ""qrkode"": {}
            }";

            var response = await Execute(body);

            Assert.NotNull(response.Body);
            Assert.Equal((int)HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task OKMedQRKodeLenke()
        {
            var body =
                @"{
                ""brevmal"": ""dat/dokumentmaler/asbest/4-nb-bekreftelse-mottat-asbest-melding.docx"",
                ""flettedata"": [
                    { ""navn"": ""Organisasjonsnummer"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Dato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Saksnummer"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Virksomhetsnavn"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Gateadresse"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Postnr"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Poststed"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Jobbadresse"", ""verdi"": ""123456789"" },
                    { ""navn"": ""StartDato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""SluttDato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""TypeArbeid"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Mottatt"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Saksbehandler"", ""verdi"": ""123456789"" }
                ],
                ""qrkode"": {
                    ""lenke"": ""https://www.vg.no""
                }
            }";

            var response = await Execute(body);

            Assert.NotNull(response.Body);
            Assert.Equal((int)HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task OKMedQRKodeLenkeOgTomStyling()
        {
            var body =
                @"{
                ""brevmal"": ""dat/dokumentmaler/asbest/4-nb-bekreftelse-mottat-asbest-melding.docx"",
                ""flettedata"": [
                    { ""navn"": ""Organisasjonsnummer"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Dato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Saksnummer"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Virksomhetsnavn"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Gateadresse"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Postnr"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Poststed"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Jobbadresse"", ""verdi"": ""123456789"" },
                    { ""navn"": ""StartDato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""SluttDato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""TypeArbeid"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Mottatt"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Saksbehandler"", ""verdi"": ""123456789"" }
                ],
                ""qrkode"": {
                    ""lenke"": ""https://www.vg.no"",
                    ""styling"": {}
                }
            }";

            var response = await Execute(body);

            Assert.NotNull(response.Body);
            Assert.Equal((int)HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task OKMedQRKodeLenkeOgHalvStyling()
        {
            var body =
                @"{
                ""brevmal"": ""dat/dokumentmaler/asbest/4-nb-bekreftelse-mottat-asbest-melding.docx"",
                ""flettedata"": [
                    { ""navn"": ""Organisasjonsnummer"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Dato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Saksnummer"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Virksomhetsnavn"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Gateadresse"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Postnr"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Poststed"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Jobbadresse"", ""verdi"": ""123456789"" },
                    { ""navn"": ""StartDato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""SluttDato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""TypeArbeid"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Mottatt"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Saksbehandler"", ""verdi"": ""123456789"" }
                ],
                ""qrkode"": {
                    ""lenke"": ""https://www.vg.no"",
                    ""styling"": {
                        ""xPos"": 50,
                        ""bredde"": 50
                    }
                }
            }";

            var response = await Execute(body);

            Assert.NotNull(response.Body);
            Assert.Equal((int)HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task FeilerMedTomQRKodeLenke()
        {
            var body =
                @"{
                ""brevmal"": ""dat/dokumentmaler/asbest/4-nb-bekreftelse-mottat-asbest-melding.docx"",
                ""flettedata"": [
                    { ""navn"": ""Organisasjonsnummer"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Dato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Saksnummer"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Virksomhetsnavn"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Gateadresse"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Postnr"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Poststed"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Jobbadresse"", ""verdi"": ""123456789"" },
                    { ""navn"": ""StartDato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""SluttDato"", ""verdi"": ""123456789"" },
                    { ""navn"": ""TypeArbeid"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Mottatt"", ""verdi"": ""123456789"" },
                    { ""navn"": ""Saksbehandler"", ""verdi"": ""123456789"" }
                ],
                ""qrkode"": {
                    ""lenke"": """"
                }
            }";

            var response = await Execute(body);

            Assert.NotNull(response.Body);
            Assert.Equal((int)HttpStatusCode.BadRequest, response.StatusCode);
        }

        public async Task<APIGatewayProxyResponse> Execute(string body)
        {
            return await _brevgenerator.FunctionHandler(
                new APIGatewayProxyRequest() { Path = "", Body = body },
                _context.Object
            );
        }
    }
}

using System.IO;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Model;
using Aspose.Words.Fonts;

namespace Brevgenerator
{
    public class S3FontSource : StreamFontSource
    {
        private readonly IAmazonS3 _client;
        private readonly string _bucketName;

        private readonly string _key;
        public S3FontSource(IAmazonS3 client, string bucketName, string key)
        {
            _client = client;
            _bucketName = bucketName;
            _key = key;
        }

        public override Stream OpenFontDataStream()
        {
            var request = new GetObjectRequest
            {
                BucketName = _bucketName,
                Key = _key
            };

            var fontStream = new MemoryStream();
            var task = Task.Run(async () => await _client.GetObjectAsync(request));
            using (var response = task.Result)
            {
                response.ResponseStream.CopyTo(fontStream);
                fontStream.Position = 0;
            }

            return fontStream;
        }



    }
}

using System.Text.Json;

namespace Brevgenerator;

public class Flettedata
{
    public static string FlettedataToDictString(List<FlettedataFelt>? flettedata)
    {
        if (flettedata == null)
        {
            return "{}";
        }

        var dict = flettedata.ToDictionary(f => f.Navn, f => f.Verdi);

        var tempClass = JsonSerializer.Serialize(dict);

        return tempClass;
    }
}

public record FlettedataFelt(string Navn, string Verdi);

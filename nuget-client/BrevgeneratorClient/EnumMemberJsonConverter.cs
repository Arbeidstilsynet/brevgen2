using System.Reflection;
using System.Runtime.Serialization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Arbeidstilsynet.Brevgenerator.Client;

internal class EnumMemberJsonConverter : JsonConverterFactory
{
    public override bool CanConvert(Type typeToConvert) => typeToConvert.IsEnum;

    public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options)
    {
        // Create a generic instance of the converter for the specific enum type
        var converterType = typeof(EnumMemberConverter<>).MakeGenericType(typeToConvert);
        return (JsonConverter)Activator.CreateInstance(converterType)!;
    }

    private class EnumMemberConverter<T> : JsonConverter<T>
        where T : struct, Enum
    {
        private readonly Dictionary<T, string> _enumToString = new();
        private readonly Dictionary<string, T> _stringToEnum = new();

        public EnumMemberConverter()
        {
            foreach (var field in typeof(T).GetFields(BindingFlags.Public | BindingFlags.Static))
            {
                var enumValue = (T)field.GetValue(null)!;
                var enumMemberAttr = field.GetCustomAttribute<EnumMemberAttribute>();
                var stringValue = enumMemberAttr?.Value ?? field.Name;

                _enumToString[enumValue] = stringValue;
                _stringToEnum[stringValue] = enumValue;
            }
        }

        public override T Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            string? value = reader.GetString();
            if (value != null && _stringToEnum.TryGetValue(value, out T enumValue))
            {
                return enumValue;
            }

            throw new JsonException($"Unable to convert \"{value}\" to enum \"{typeof(T)}\"");
        }

        public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
        {
            if (_enumToString.TryGetValue(value, out var stringValue))
            {
                writer.WriteStringValue(stringValue);
            }
            else
            {
                throw new JsonException($"Unable to convert enum \"{value}\" to string");
            }
        }
    }
}

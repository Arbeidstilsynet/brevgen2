using Arbeidstilsynet.Common.BrevgeneratorClient.Model;

namespace Arbeidstilsynet.Common.BrevgeneratorClient.Ports
{
    /// <summary>
    /// Klient for å genere et brev basert på <see cref="GenererBrevArgs"/>
    /// </summary>
    public interface IBrevgeneratorClient
    {
        /// <summary>
        /// Generer et brev ut i fra dynamisk markdown, variabler (flettefelt) og diverse konfigurasjon.<br />
        /// Bruk IGenererBrevArgsBuilder til å bygge og validere payload for spørringen.
        /// </summary>
        /// <param name="payload"></param>
        /// <returns>Base-64 encoded buffer med PDF, eller vanlig string med HTML hvis options.AsHtml=true</returns>
        Task<string> GenererBrev(GenererBrevArgs payload);
    }
}

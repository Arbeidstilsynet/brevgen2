using Arbeidstilsynet.Brevgenerator.Client.Models;

namespace Arbeidstilsynet.Brevgenerator.Client
{
    public interface IBrevgeneratorKlient
    {
        /// <summary>
        /// Generer et brev ut i fra dynamisk markdown, variabler (flettefelt) og diverse konfigurasjon.<br />
        /// Bruk GenererBrevArgsBuilder til å bygge og validere payload for spørringen.
        /// </summary>
        /// <param name="payload"></param>
        /// <returns>Base-64 encoded buffer med PDF, eller vanlig string med HTML hvis options.AsHtml=true</returns>
        Task<string> GenererBrev(GenererBrevArgs payload);
    }
}

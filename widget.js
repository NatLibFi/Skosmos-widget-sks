// declaring a namespace for the plugin
/* global Vue */

const SKS = {
  vueApp: null,
  createVueApp: function () {
    return Vue.createApp({
      data () {
        return {
          sksCaption: SKS.caption(),
          sksDescriptionText: SKS.sksDescriptionText(),
          sksURN: SKS.address,
          sksAnchorText: SKS.anchorText()
        }
      },
      template: `
                <div
                  class="sksWidget panel-group"
                  id="sksAccordion"
                  aria-multiselectable="true"
                >
                  <div class="panel panel-default">
                    <div
                      class="panel-heading"
                      id="headingSks"
                    >
                      <h2 class="mb-0">
                        <button
                        class="accordion-button accordion"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapseSks"
                        aria-expanded="false"
                        aria-controls="collapseSks"
                        >
                          {{sksCaption}}
                        </button>
                      </h2>
                    </div>
                      <div
                      id="collapseSks"
                      class="panel-collapse collapse show"
                      aria-labelledby="headingSks"
                      >
                      <div class="panel-body">
                        <div id="sks-description-text-block">
                          <i class="fa-solid fa-circle-info"></i>
                          {{sksDescriptionText}}
                        </div>
                        <div
                        id="sks"
                        class="panel position-sticky"
                        aria-labelledby="headingSks"
                        >
                          <iframe id="sksFrame" :src="sksURN"></iframe>
                        </div>
                        <div id="sksPanel">
                          <a :href=sksURN target="_blank">{{sksAnchorText}}</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                `,
      methods: {

      }
    })
  },
  address: '', // to be updated
  anchorText: function () {
    let lang = window.SKOSMOS.lang
    if (lang !== 'fi' && lang !== 'sv' && lang !== 'se') {
      lang = 'en'
    }
    return {
      fi: 'Katso SKS:n Henkilöhistoria-sivu',
      sv: 'Se Finska Litteratursällskapets biografisida',
      en: 'See the Finnish Literature Society biography page',
      se: ''
    }[lang]
  },
  category: '',
  setVariables: function (match) {
    if (match.startsWith('http://urn.fi/urn:nbn:fi:sks-kbg-')) {
      this.address = '//kansallisbiografia.fi/kansallisbiografia/henkilo/' + match.substr(33).replace(/^0+/, '')
      this.category = 'kansallisbiografia'
    } else if (match.startsWith('http://urn.fi/urn:nbn:fi:sks-spa-')) {
      this.address = '//kansallisbiografia.fi/papisto/henkilo/' + match.substr(33).replace(/^0+/, '')
      this.category = 'papisto'
    } else if (match.startsWith('http://urn.fi/urn:nbn:fi:sks-thp-')) {
      this.address = '//kansallisbiografia.fi/paimenmuisto/henkilo/' + match.substr(33).replace(/^0+/, '')
      this.category = 'paimenmuisto'
    }
  },
  prefLabel: '',
  caption: function () {
    let lang = window.SKOSMOS.lang
    if (lang !== 'fi' && lang !== 'sv' && lang !== 'se') {
      lang = 'en'
    }
    let captionText = ''
    const captionTexts = {
      kansallisbiografia: {
        fi: 'Kansallisbiografia (SKS) > ',
        sv: 'Finlands nationalbiografi (SKS) > ',
        en: 'The National Biography of Finland (SKS) > ',
        se: 'Kansallisbiografia - Álbmotbiografiija (SKS) > '
      },
      papisto: {
        fi: 'Suomen papisto 1800–1920 (SKS) > ',
        sv: 'Finlands prästerskap 1800–1920 (SKS) > ',
        en: 'The clergy of Finland 1800–1920 (SKS) > ',
        se: 'Suoma páhppagoddi 1800–1920 (SKS) > '
      },
      paimenmuisto: {
        fi: 'Turun hiippakunnan paimenmuisto (SKS) > ',
        sv: 'Åbo stifts herdaminne (SKS) > ',
        en: 'Biographical register of the Diocese of Turku (SKS) > ',
        se: 'Turku bismagotti báimmanmuitu (SKS) > '
      }
    }
    if (this.category in captionTexts) {
      captionText = captionTexts[this.category][lang] + this.prefLabel
    }
    return captionText
  },
  sksDescriptionText: function () {
    return {
      fi: 'Kaikki artikkelitiivistelmät ja osa artikkeleista vapaasti saatavilla. Pääsy muihin artikkeleihin vain lisenssillä.',
      sv: 'Alla artikelsammandrag och en del av artiklarna är fritt tillgängliga. Tillgång till andra artiklar kräver licens.',
      en: 'All article summaries and some complete articles are freely available. Accessing other articles requires a license.',
      se: 'Buot artihkalčoahkkáigeasut ja oassi artihkkaliin friija oažžunsajis. Beassan eará artihkkaliidda dušše liseanssain.'
    }[window.SKOSMOS.lang]
  },
  appendMountPoint: function () {
    const mountPoint = document.getElementById('sks-plugin')
    if (mountPoint) {
      if (this.vueApp) {
        this.vueApp.unmount()
      }
      mountPoint.remove()
    }
    const newMountPoint = document.createElement('div')
    newMountPoint.id = 'sks-plugin'
    document.getElementById('main-content-bottom-slot').appendChild(newMountPoint)
  },
  render: function () {
    this.vueApp = this.createVueApp()
    this.vueApp.mount('#sks-plugin')
  },
  remove: function () {
    if (this.vueApp) {
      this.vueApp.unmount()
      this.vueApp = null
    }
  },
  preferred_label: ''
}

document.addEventListener('DOMContentLoaded', function () {
  window.sksWidget = function (data) {
    // Only activate the widget when
    // 1) on a concept page
    // 2) and there is a prefLabel
    // 3) and the json-ld data can be found
    if (
      data.pageType !== 'concept' ||
      data.prefLabels.length === 0 ||
      Object.keys(data.jsonLd).length === 0
    ) {
      SKS.remove()
      return
    }

    const context = data.jsonLd['@context']
    const jsonLdUriSpace = Object.keys(context).find(key => context[key] === window.SKOSMOS.uriSpace)
    const skosmosUriSpace = window.SKOSMOS.uriSpace
    const jsonLdUri = data.uri.replace(skosmosUriSpace, jsonLdUriSpace + ':')
    const matches = []
    const matchTypes = ['skos:exactMatch', 'skos:closeMatch']

    for (const concept of data.jsonLd.graph) {
      for (const matchType of matchTypes) {
        if (concept.uri === jsonLdUri) {
          if (Array.isArray(concept[matchType])) {
            for (const cm of concept[matchType]) {
              if (cm.uri.startsWith('http://urn.fi/urn:nbn:fi:sks')) {
                matches.push(cm.uri)
              }
            }
          } else {
            if (matchType in concept && concept[matchType].uri.startsWith('http://urn.fi/urn:nbn:fi:sks')) {
              matches.push(concept[matchType].uri)
            }
          }
        }
      }
    }

    if (matches.length === 0) {
      SKS.remove()
      return
    }

    const match = matches[0]
    SKS.prefLabel = data.prefLabels.find(item => item.lang === 'fi').label
    if (SKS.prefLabel === null) {
      SKS.remove()
      return
    }

    SKS.appendMountPoint()
    if (!Array.isArray(match)) {
      SKS.setVariables(match)
      SKS.render()
    }
  }
})

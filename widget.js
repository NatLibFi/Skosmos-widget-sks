// declaring a namespace for the plugin
var SKS = SKS || {};

SKS = {
    address: "", // to be updated
    getTranslation: function (key) {
        var getLang = lang;
        if (lang !== "fi" && lang !== "sv") {
            getLang = "en";
        }
        if (key === "sksCaption") {
            var pref = SKS.preferred_label + $("#pref-label + .prefLabelLang").text();
            return {
                "fi": "Kansallisbiografia (SKS) > " + pref,
                "sv": "Finlands nationalbiografi (SKS) > " + pref, 
                "en": "The National Biography of Finland (SKS) > " + pref
            }[getLang];
        }
        if (key === "sksDescriptionText") {
            return {
                "fi": "Kaikki artikkelitiivistelmät ja osa artikkeleista vapaasti saatavilla. Pääsy muihin artikkeleihin vain lisenssillä.",
                "sv": "Alla artikelsammandrag och en del av artiklarna är fritt tillgängliga. Tillgång till andra artiklar kräver licens.", 
                "en": "All article summaries and some complete articles are freely available. Accessing other articles requires a license."
            }[getLang];
        }
        else {
            return "";
        }
    },
    $iframeWrapper: "",
    initialize: function() {
        var context = {
            opened: Boolean(SKS.isOpen),
            sksCaption: SKS.getTranslation("sksCaption"),
            sksDescriptionText: SKS.getTranslation("sksDescriptionText"),
            sksURN: SKS.address,
        };
        var $template =  $($.parseHTML(Handlebars.compile($('#sks-template').html())(context))[0]);
        SKS.$iframeWrapper = $template.find("#sks");
   
        var $loading = $("<p id='sksSpinner' class='concept-spinner center-block'>" + loading_text + "&hellip;</p>");
        SKS.$iframeWrapper.prepend($loading);
        SKS.$iframeWrapper.find('iframe').on('load', function() {
            SKS.$iframeWrapper.find('#sksSpinner').remove();
        });
        
        if (!SKS.isOpen) {
            SKS.$iframeWrapper.detach();
        }

        $template.find('#collapseSks').on('show.bs.collapse', function(e, y) {
            createCookie('SKS_WIDGET_OPEN', 1);
            // if the widget has not been opened yet (lazy loading)
            if (!$template.find('#sks').length) {
                $('#collapseSks .panel-body').append(SKS.$iframeWrapper);
            }
         });

         $template.find('#collapseSks').on('hide.bs.collapse', function(e, y) {
             createCookie('SKS_WIDGET_OPEN', 0);
         });
        $('.concept-info').after($template);
    },
    isOpen: true,
    preferred_label: "",
    widget: {
        render: function () {
            var openCookie = readCookie('SKS_WIDGET_OPEN');
            SKS.isOpen = openCookie !== null ? parseInt(openCookie, 10) : 1;
            SKS.initialize();
        },
    }
};

$(function() {

    window.sksWidget = function (data) {
        // Only activate the widget when
        // 1) on a concept page
        // 2) and there is a prefLabel
        // 3) and the json-ld data can be found
        // 4) and the latitude and longitude are defined
        if (data.page !== 'page' || data.prefLabels === undefined || $.isEmptyObject(data["json-ld"])) {
            return;
        }

        var correct_jsonld_objects = []; // only a single value is expected

        correct_jsonld_objects = $.grep(data["json-ld"].graph, function (obj) {
            // only requested URI should have mappings, and, therefore, closeMatch
            return obj['skos:closeMatch'];
        });

        if (correct_jsonld_objects.length == 0) {
            return;
        }
        
        var updated_jsonld_data = correct_jsonld_objects[0];
        var closeMatch = updated_jsonld_data['skos:closeMatch']; 

        if (!$.isArray(closeMatch) && closeMatch.uri.startsWith('http://urn.fi/urn:nbn:fi:sks-kbg-')) {
            // single object value with SKS URN, proceed to render
            SKS.address = '//kansallisbiografia.fi/kansallisbiografia/henkilo/' + closeMatch.uri.substr(33).replace(/^0+/, '');
            SKS.preferred_label = $("span.prefLabel.conceptlabel")[0].innerHTML;
            SKS.widget.render();
        }
        else {
            return;
        }
    }

});

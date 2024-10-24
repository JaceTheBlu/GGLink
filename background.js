// Crée un élément dans le menu contextuel
browser.contextMenus.create({
    id: "mon-extension",
    title: browser.i18n.getMessage("menuSelection"),
    contexts: ["selection"] // Seulement lorsque du texte est sélectionné
});

// Ecoute l'événement lorsque l'élément du menu est cliqué
browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "mon-extension") {
        let selectedText = info.selectionText;

        // Exécution d'un script pour ajuster la sélection à gauche et à droite
        const [adjustedSelection] = await browser.tabs.executeScript(tab.id, {
            code: `
                (function() {
                    const selection = window.getSelection();
                    const range = selection.getRangeAt(0);
                    const startContainer = range.startContainer;
                    const endContainer = range.endContainer;
                    let startOffset = range.startOffset;
                    let endOffset = range.endOffset;

                    // Récupère le texte complet des nœuds contenant la sélection
                    const startText = startContainer.textContent;
                    const endText = endContainer.textContent;

                    // Étend la sélection vers la gauche si elle ne commence pas après un espace ou un saut de ligne
                    while (startOffset > 0 && !/\\s/.test(startText[startOffset - 1])) {
                        startOffset--;
                    }

                    // Étend la sélection vers la droite si elle ne se termine pas par un espace ou un saut de ligne
                    while (endOffset < endText.length && !/\\s/.test(endText[endOffset])) {
                        endOffset++;
                    }

                    // Crée un nouveau Range avec les nouvelles positions de début et de fin
                    const newRange = document.createRange();
                    newRange.setStart(startContainer, startOffset);
                    newRange.setEnd(endContainer, endOffset);
                    
                    // Ajuste la sélection visuellement
                    selection.removeAllRanges();
                    selection.addRange(newRange);

                    return newRange.toString(); // Renvoie le texte ajusté
                })();
            `
        });

        // Utilise la nouvelle sélection ajustée
        selectedText = adjustedSelection || selectedText;

        // Récupère l'URL de l'onglet actif
        let url = tab.url;

        // Encode le texte sélectionné pour l'inclure dans l'URL comme fragment de texte
        const textFragment = `#:~:text=${encodeURIComponent(selectedText.trim())}`;
        
        // Vérifie si l'URL contient déjà un fragment de texte
        if (url.includes("#:~:text=")) {
            // Remplace le fragment de texte existant par le nouveau
            url = url.replace(/#:~:text=[^#]+/, textFragment);
        } else {
            // Sinon, ajoute simplement le fragment de texte à l'URL
            url = url + textFragment;
        }
        
        // Copie cette URL dans le presse-papiers
        try {
            await navigator.clipboard.writeText(url);
            console.log(`high2link - URL: ${url}`);
        } catch (err) {
            console.error("high2link - Erreur: ", err);
        }
    }
});

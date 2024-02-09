 switch (global.list_media[flagPosId].type) {
      case "song":
        console.log("ENTROU SONG");

        await api.MediaPlaylistAction(id_atual);

        await waitPresentationActive(id_atual);

        await waitSlideAtual(-1, dataHTML);

        slide_total = global.slide_atual.slide_total;
        slide_index = global.slide_atual.slide_index;

        console.log("Slide Total: " + slide_total + " | Slide Atual: " + slide_index);

        // Requisição título
        dataHTML = await requisitionHolyricsHTML();
        await pdf.organizeTextPDF(dataHTML.map.text, pdf.textParams[TextType.TITLE]);

        for (j = 1; j <= slide_total; j++) {
          await api.changeSlide(req_next_slide, simulatedResponse);
          await waitSlideAtual(slide_index, dataHTML);
          dataHTML = await requisitionHolyricsHTML();

          slide_index = global.slide_atual.slide_index;

          // Verifica Slide errado
          await verificaSlide(j, slide_index);

          await pdf.organizeTextPDF(j + ". " + dataHTML.map.text.replace(/\t/g, ' ').replace(/\x00D/g, ' '), pdf.textParams[TextType.REGULAR]);
        }

        await api.closeCurrentPresentation();
        break;
      case "text":
        console.log("ENTROU TEXT");

        await api.MediaPlaylistAction(id_atual);

        await waitPresentationActive(id_atual);

        await waitSlideAtual(-1, dataHTML);

        slide_total = global.slide_atual.slide_total;
        slide_index = global.slide_atual.slide_index;

        console.log("Slide Total: " + slide_total + " | Slide Atual: " + slide_index);

        // Requisição título
        dataHTML = await requisitionHolyricsHTML();
        await pdf.organizeTextPDF(dataHTML.map['$system_var_text_title'], pdf.textParams[TextType.TITLE]);
        await pdf.organizeTextPDF(dataHTML.map.text.replace(/\t/g, ' ').replace(/\x00D/g, ''), pdf.textParams[TextType.REGULAR]);

        for (j = 2; j <= slide_total; j++) {
          await api.changeSlide(req_next_slide, simulatedResponse);
          await waitSlideAtual(slide_index, dataHTML);
          dataHTML = await requisitionHolyricsHTML();

          slide_index = global.slide_atual.slide_index;

          // Verifica Slide errado
          await verificaSlide(j, slide_index);

          // TODO: Precisa separar linhas de O - 
          // if (dataHTML.map.text.includes('C -') || dataHTML.map.text.includes('C –')) {
          //   console.log("bold\n\n\n");
          //   await pdf.organizeTextPDF(dataHTML.map.text, pdf.textParams[TextType.REGULAR_BOLD]);
          // } else
          await pdf.organizeTextPDF(dataHTML.map.text.replace(/\t/g, ' ').replace(/\x00D/g, ' '), pdf.textParams[TextType.REGULAR]);
        }

        dataHTML = await requisitionHolyricsHTML();
        await api.closeCurrentPresentation();
        break;
      case "image":
        console.log("ENTROU IMAGE");

        await api.MediaPlaylistAction(id_atual);

        await waitPresentationActiveImg(id_atual);

        // Título Img
        await pdf.organizeTextPDF(global.list_media[flagPosId].name, pdf.textParams[TextType.TITLE]);

        dataHTML = await requisitionHolyricsHTML();
        img64 = dataHTML.map.img64;

        pdf.drawPhoto(img64.split("'")[0], scaleW, scaleH);

        await api.closeCurrentPresentation();
        break;
      case "announcement":
        console.log("ENTROU ANNOUNCEMENT");

        dataHTML = await requisitionHolyricsHTML();
        imgID = 0;

        await api.MediaPlaylistAction(id_atual);

        await waitPresentationActiveAnunc(id_atual, imgID);

        // Título
        await pdf.organizeTextPDF(global.list_media[flagPosId].name, pdf.textParams[TextType.TITLE]);

        slide_total = global.slide_atual.total_slides;

        for (j = 1; j <= slide_total; j++) {
          await waitPresentationActiveAnunc(id_atual, imgID);

          dataHTML = await requisitionHolyricsHTML();
          img64 = dataHTML.map.img64;
          pdf.drawPhoto(img64.split("'")[0], scaleW, scaleH);
          imgID = dataHTML.map.img_id;

          if (j != slide_total)
            await api.changeSlide(req_next_slide, simulatedResponse);
        }

        await api.closeCurrentPresentation();

        // Aguarda 1,5s para chamar a próxima presentation
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 1500);
        });

        break;
      case "verse":
        await api.MediaPlaylistAction(id_atual);

        await waitPresentationActiveVerse(id_atual);

        // Título
        await pdf.organizeTextPDF(global.list_media[flagPosId].name, pdf.textParams[TextType.TITLE]);

        while (global.pos_id == flagPosId) {
          //await waitPresentationActiveVerse(id_atual);

          dataHTML = await requisitionHolyricsHTML();

          header = striptags(dataHTML.map.header).split(" - ")[0] + " - ";

          await pdf.organizeTextPDF(header + dataHTML.map.text.replace(/\t/g, ' ').replace(/\x00D/g, ' '), pdf.textParams[TextType.REGULAR]);

          await api.changeSlide(req_next_slide, simulatedResponse);

          // Aguarda 1,5s para chamar a próxima presentation
          await new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 1500);
          });
        }

        await api.closeCurrentPresentation();

        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 3000);
        });
        break;
      default:
        break;
    }
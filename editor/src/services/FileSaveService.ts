export class FileSaveService {
    saveFile(blob, filename) {
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, filename);
        } else {
            let a = $('<a></a>') as JQuery<HTMLLinkElement>;
            a.appendTo($('body'));
            let url = window.URL.createObjectURL(blob);
            a[0].setAttribute('href', url);
            a[0].setAttribute('download', filename);
            a[0].click();
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                a.remove();
            }, 0)
        }
    }
}
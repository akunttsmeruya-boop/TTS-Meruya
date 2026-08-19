const API_URL =
  'https://script.google.com/macros/s/AKfycby6oun4jsNNoK38OBrK6ds-Nt4MzeoyhrODmMjzMTQQZ99sNgx65lTGbczbX2plhrDv6Q/exec';


const prodCodeInput =
  document.getElementById('prodCodeInput');

const searchResults =
  document.getElementById('searchResults');

const searchLoading =
  document.getElementById('searchLoading');

const selectedProduct =
  document.getElementById('selectedProduct');

const selectedProdCode =
  document.getElementById('selectedProdCode');

const selectedProdName =
  document.getElementById('selectedProdName');

const selectedBarcode =
  document.getElementById('selectedBarcode');

const photoInput =
  document.getElementById('photoInput');

const previewContainer =
  document.getElementById('previewContainer');

const photoPreview =
  document.getElementById('photoPreview');

const removePhoto =
  document.getElementById('removePhoto');

const uploadButton =
  document.getElementById('uploadButton');

const statusBox =
  document.getElementById('status');


let selectedProd = null;

let selectedFile = null;

let searchTimer = null;


/**
 * SEARCH PROD CODE
 */
prodCodeInput.addEventListener(
  'input',
  function () {

    const query =
      this.value.trim();

    selectedProd = null;

    selectedProduct.classList.add(
      'hidden'
    );

    updateUploadButton();

    clearTimeout(searchTimer);

    if (!query) {

      searchResults.classList.add(
        'hidden'
      );

      return;
    }

    searchTimer = setTimeout(
      function () {

        searchProducts(query);

      },
      300
    );
  }
);


/**
 * SEARCH API
 */
async function searchProducts(query) {

  searchLoading.classList.remove(
    'hidden'
  );

  searchResults.classList.remove(
    'hidden'
  );

  searchResults.innerHTML =
    '<div class="no-result">Mencari...</div>';

  try {

    const url =
      API_URL +
      '?action=search&query=' +
      encodeURIComponent(query);

    const response =
      await fetch(url);

    const result =
      await response.json();

    if (!result.success) {

      throw new Error(
        result.message ||
        'Gagal mencari data.'
      );

    }

    renderSearchResults(
      result.data
    );

  } catch (error) {

    searchResults.innerHTML =
      '<div class="no-result">' +
      'Gagal mengambil data.' +
      '</div>';

    console.error(error);

  } finally {

    searchLoading.classList.add(
      'hidden'
    );

  }
}


/**
 * RENDER DROPDOWN
 */
function renderSearchResults(data) {

  searchResults.innerHTML = '';

  if (!data || data.length === 0) {

    searchResults.innerHTML =
      '<div class="no-result">' +
      'ProdCode tidak ditemukan' +
      '</div>';

    return;
  }


  data.forEach(
    function (product) {

      const item =
        document.createElement('div');

      item.className =
        'search-item';


      item.innerHTML = `
        <div class="search-item-code">
          ${escapeHtml(product.prodCode)}
        </div>

        <div class="search-item-name">
          ${escapeHtml(product.prodName)}
        </div>

        <div class="search-item-barcode">
          Barcode: ${escapeHtml(product.barcode)}
        </div>
      `;


      item.addEventListener(
        'click',
        function () {

          selectProduct(product);

        }
      );


      searchResults.appendChild(item);

    }
  );
}


/**
 * SELECT PRODUCT
 */
function selectProduct(product) {

  selectedProd = product;

  prodCodeInput.value =
    product.prodCode;

  selectedProdCode.textContent =
    product.prodCode;

  selectedProdName.textContent =
    product.prodName;

  selectedBarcode.textContent =
    'Barcode: ' +
    product.barcode;

  selectedProduct.classList.remove(
    'hidden'
  );

  searchResults.classList.add(
    'hidden'
  );

  clearStatus();

  updateUploadButton();
}


/**
 * PHOTO SELECT
 */
photoInput.addEventListener(
  'change',
  function () {

    const file =
      this.files[0];

    if (!file) {
      return;
    }


    if (!file.type.startsWith('image/')) {

      showStatus(
        'File harus berupa gambar.',
        'error'
      );

      this.value = '';

      return;
    }


    selectedFile = file;


    // Preview menggunakan foto asli
    const reader =
      new FileReader();


    reader.onload =
      function (event) {

        photoPreview.src =
          event.target.result;

        previewContainer.classList.remove(
          'hidden'
        );

      };


    reader.readAsDataURL(file);


    clearStatus();

    updateUploadButton();

  }
);


/**
 * REMOVE PHOTO
 */
removePhoto.addEventListener(
  'click',
  function () {

    selectedFile = null;

    photoInput.value = '';

    photoPreview.src = '';

    previewContainer.classList.add(
      'hidden'
    );

    updateUploadButton();

  }
);


/**
 * UPDATE BUTTON
 */
function updateUploadButton() {

  uploadButton.disabled =
    !selectedProd ||
    !selectedFile;

}


/**
 * UPLOAD
 */
uploadButton.addEventListener(
  'click',
  async function () {

    if (!selectedProd) {

      showStatus(
        'Pilih ProdCode terlebih dahulu.',
        'error'
      );

      return;
    }


    if (!selectedFile) {

      showStatus(
        'Pilih foto terlebih dahulu.',
        'error'
      );

      return;
    }


    uploadButton.disabled = true;

    uploadButton.textContent =
      'MENGOMPRES & UPLOAD...';


    showStatus(
      'Menyiapkan foto...',
      'loading'
    );


    try {

      /**
       * =========================================
       * KOMPRES FOTO
       * =========================================
       */

      const compressedFile =
        await compressImage(
          selectedFile
        );


      console.log(
        'Ukuran asli:',
        formatFileSize(
          selectedFile.size
        )
      );


      console.log(
        'Ukuran setelah kompres:',
        formatFileSize(
          compressedFile.size
        )
      );


      showStatus(
        'Mengupload foto ' +
        formatFileSize(
          compressedFile.size
        ) +
        '...',
        'loading'
      );


      /**
       * =========================================
       * CONVERT BASE64
       * =========================================
       */

      const base64 =
        await fileToBase64(
          compressedFile
        );


      /**
       * =========================================
       * PAYLOAD
       * =========================================
       */

      const payload = {

        prodCode:
          selectedProd.prodCode,

        fileName:
          selectedProd.prodCode +
          '.jpg',

        mimeType:
          'image/jpeg',

        fileData:
          base64

      };


      /**
       * =========================================
       * SEND KE APPS SCRIPT
       * =========================================
       */

      const response =
        await fetch(
          API_URL,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'text/plain;charset=utf-8'
            },

            body:
              JSON.stringify(payload)

          }
        );


      const result =
        await response.json();


      if (!result.success) {

        throw new Error(
          result.message ||
          'Upload gagal.'
        );

      }


      /**
       * =========================================
       * SUCCESS
       * =========================================
       */

      showStatus(
        '✓ Foto berhasil disimpan sebagai ' +
        result.fileName,
        'success'
      );


      /**
       * RESET FOTO
       */

      selectedFile = null;

      photoInput.value = '';

      photoPreview.src = '';

      previewContainer.classList.add(
        'hidden'
      );


    } catch (error) {

      console.error(error);

      showStatus(
        error.message ||
        'Terjadi kesalahan saat upload.',
        'error'
      );

    } finally {

      uploadButton.textContent =
        'KIRIM FOTO';

      updateUploadButton();

    }

  }
);


/**
 * =========================================
 * KOMPRESI FOTO
 * =========================================
 *
 * Maksimal dimensi:
 * 1600 x 1600 px
 *
 * JPEG quality:
 * 80%
 *
 */
function compressImage(file) {

  return new Promise(
    function (resolve, reject) {

      const img =
        new Image();

      const reader =
        new FileReader();


      reader.onload =
        function (event) {

          img.onload =
            function () {

              const MAX_SIZE = 1600;

              let width =
                img.width;

              let height =
                img.height;


              /**
               * Resize jika terlalu besar
               */

              if (
                width > MAX_SIZE ||
                height > MAX_SIZE
              ) {

                if (width > height) {

                  height =
                    Math.round(
                      height *
                      MAX_SIZE /
                      width
                    );

                  width =
                    MAX_SIZE;

                } else {

                  width =
                    Math.round(
                      width *
                      MAX_SIZE /
                      height
                    );

                  height =
                    MAX_SIZE;

                }

              }


              /**
               * Canvas
               */

              const canvas =
                document.createElement(
                  'canvas'
                );


              canvas.width =
                width;

              canvas.height =
                height;


              const ctx =
                canvas.getContext(
                  '2d'
                );


              /**
               * Supaya hasil foto
               * tetap bagus
               */

              ctx.imageSmoothingEnabled =
                true;

              ctx.imageSmoothingQuality =
                'high';


              ctx.drawImage(
                img,
                0,
                0,
                width,
                height
              );


              /**
               * Convert ke JPEG
               */

              canvas.toBlob(
                function (blob) {

                  if (!blob) {

                    reject(
                      new Error(
                        'Gagal melakukan kompresi foto.'
                      )
                    );

                    return;
                  }


                  /**
                   * Buat file baru
                   */

                  const compressedFile =
                    new File(
                      [blob],
                      'photo.jpg',
                      {
                        type:
                          'image/jpeg',

                        lastModified:
                          Date.now()
                      }
                    );


                  resolve(
                    compressedFile
                  );

                },

                'image/jpeg',

                0.80

              );

            };


          img.onerror =
            function () {

              reject(
                new Error(
                  'Foto tidak dapat dibaca.'
                )
              );

            };


          img.src =
            event.target.result;

        };


      reader.onerror =
        function () {

          reject(
            new Error(
              'Gagal membaca foto.'
            )
          );

        };


      reader.readAsDataURL(file);

    }
  );
}


/**
 * =========================================
 * CONVERT FILE → BASE64
 * =========================================
 */
function fileToBase64(file) {

  return new Promise(
    function (resolve, reject) {

      const reader =
        new FileReader();


      reader.onload =
        function () {

          const result =
            reader.result;


          /**
           * Hapus:
           *
           * data:image/jpeg;base64,
           */

          const base64 =
            result.split(',')[1];


          resolve(
            base64
          );

        };


      reader.onerror =
        function () {

          reject(
            new Error(
              'Gagal membaca foto.'
            )
          );

        };


      reader.readAsDataURL(file);

    }
  );
}


/**
 * =========================================
 * FORMAT UKURAN FILE
 * =========================================
 */
function formatFileSize(bytes) {

  if (bytes < 1024) {

    return (
      bytes +
      ' B'
    );

  }


  if (
    bytes <
    1024 * 1024
  ) {

    return (
      (bytes / 1024)
        .toFixed(0) +
      ' KB'
    );

  }


  return (
    (bytes /
      (1024 * 1024))
      .toFixed(2) +
    ' MB'
  );

}


/**
 * =========================================
 * STATUS
 * =========================================
 */
function showStatus(
  message,
  type
) {

  statusBox.textContent =
    message;

  statusBox.className =
    'status ' +
    type;

}


function clearStatus() {

  statusBox.textContent = '';

  statusBox.className =
    'status hidden';

}


/**
 * =========================================
 * SECURITY
 * =========================================
 *
 * Jangan masukkan HTML mentah
 * dari spreadsheet ke innerHTML.
 *
 */
function escapeHtml(value) {

  return String(value || '')

    .replace(
      /&/g,
      '&amp;'
    )

    .replace(
      /</g,
      '&lt;'
    )

    .replace(
      />/g,
      '&gt;'
    )

    .replace(
      /"/g,
      '&quot;'
    )

    .replace(
      /'/g,
      '&#039;'
    );

}


/**
 * =========================================
 * KLIK DI LUAR DROPDOWN
 * =========================================
 */
document.addEventListener(
  'click',
  function (event) {

    if (
      !event.target.closest(
        '.form-group'
      )
    ) {

      searchResults.classList.add(
        'hidden'
      );

    }

  }
);

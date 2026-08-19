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
      'MENGUPLOAD...';


    showStatus(
      'Sedang mengupload foto...',
      'loading'
    );


    try {

      const base64 =
        await fileToBase64(
          selectedFile
        );


      const payload = {

        prodCode:
          selectedProd.prodCode,

        fileName:
          selectedFile.name,

        mimeType:
          selectedFile.type,

        fileData:
          base64

      };


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


      showStatus(
        '✓ Foto berhasil disimpan sebagai ' +
        result.fileName,
        'success'
      );


      // Reset foto
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
 * Convert file → Base64
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

          // Hapus prefix:
          // data:image/jpeg;base64,
          const base64 =
            result.split(',')[1];

          resolve(base64);

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
 * STATUS
 */
function showStatus(
  message,
  type
) {

  statusBox.textContent =
    message;

  statusBox.className =
    'status ' + type;

}


function clearStatus() {

  statusBox.textContent = '';

  statusBox.className =
    'status hidden';

}


/**
 * Security:
 * Jangan masukkan HTML mentah dari spreadsheet
 * ke dalam innerHTML.
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
 * Klik di luar dropdown
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

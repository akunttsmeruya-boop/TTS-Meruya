const API_URL =
  'https://script.google.com/macros/s/AKfycby6oun4jsNNoK38OBrK6ds-Nt4MzeoyhrODmMjzMTQQZ99sNgx65lTGbczbX2plhrDv6Q/exec';


// =====================================================
// ELEMENT
// =====================================================

const beforeButton =
  document.getElementById('beforeButton');

const afterButton =
  document.getElementById('afterButton');

const photoButton =
  document.getElementById('photoButton');

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


// =====================================================
// STATE
// =====================================================

let selectedProd = null;

let selectedFile = null;

let selectedPhotoType = null;

let searchTimer = null;


// =====================================================
// PILIH BEFORE
// =====================================================

beforeButton.addEventListener(
  'click',
  function () {

    selectPhotoType('Before');

  }
);


// =====================================================
// PILIH AFTER
// =====================================================

afterButton.addEventListener(
  'click',
  function () {

    selectPhotoType('After');

  }
);


// =====================================================
// SELECT PHOTO TYPE
// =====================================================

function selectPhotoType(type) {

  selectedPhotoType =
    type;


  // -----------------------------------------------
  // BUTTON ACTIVE
  // -----------------------------------------------

  beforeButton.classList.remove(
    'active'
  );

  afterButton.classList.remove(
    'active'
  );


  if (type === 'Before') {

    beforeButton.classList.add(
      'active'
    );

  }


  if (type === 'After') {

    afterButton.classList.add(
      'active'
    );

  }


  // -----------------------------------------------
  // AKTIFKAN PROD CODE
  // -----------------------------------------------

  prodCodeInput.disabled =
    false;

  prodCodeInput.placeholder =
    'Ketik ProdCode...';


  // -----------------------------------------------
  // AKTIFKAN FOTO
  // -----------------------------------------------

  photoInput.disabled =
    false;

  photoButton.classList.remove(
    'disabled'
  );


  photoButton.querySelector(
    'span:last-child'
  ).textContent =
    'Ambil / Pilih Foto';


  // -----------------------------------------------
  // STATUS
  // -----------------------------------------------

  clearStatus();


  showStatus(
    'Mode ' +
    type +
    ' dipilih.',
    'loading'
  );


  setTimeout(
    function () {

      clearStatus();

    },
    1500
  );


  updateUploadButton();

}


// =====================================================
// SEARCH PROD CODE
// =====================================================

prodCodeInput.addEventListener(
  'input',
  function () {

    const query =
      this.value.trim();


    selectedProd =
      null;


    selectedProduct.classList.add(
      'hidden'
    );


    updateUploadButton();


    clearTimeout(
      searchTimer
    );


    if (!query) {

      searchResults.classList.add(
        'hidden'
      );

      return;

    }


    searchTimer =
      setTimeout(
        function () {

          searchProducts(
            query
          );

        },
        300
      );

  }
);


// =====================================================
// SEARCH API
// =====================================================

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
      encodeURIComponent(
        query
      );


    const response =
      await fetch(
        url
      );


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


    console.error(
      'Search error:',
      error
    );


  } finally {

    searchLoading.classList.add(
      'hidden'
    );

  }

}


// =====================================================
// RENDER DROPDOWN
// =====================================================

function renderSearchResults(data) {

  searchResults.innerHTML =
    '';


  if (
    !data ||
    data.length === 0
  ) {

    searchResults.innerHTML =
      '<div class="no-result">' +
      'ProdCode tidak ditemukan' +
      '</div>';


    return;

  }


  data.forEach(
    function (product) {

      const item =
        document.createElement(
          'div'
        );


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

          selectProduct(
            product
          );

        }
      );


      searchResults.appendChild(
        item
      );

    }
  );

}


// =====================================================
// SELECT PRODUCT
// =====================================================

function selectProduct(product) {

  selectedProd =
    product;


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


// =====================================================
// PHOTO SELECT
// =====================================================

photoInput.addEventListener(
  'change',
  function () {

    const file =
      this.files[0];


    if (!file) {

      return;

    }


    if (
      !file.type.startsWith(
        'image/'
      )
    ) {

      showStatus(
        'File harus berupa gambar.',
        'error'
      );


      this.value =
        '';


      return;

    }


    selectedFile =
      file;


    // -----------------------------------------------
    // PREVIEW FOTO ASLI
    // -----------------------------------------------

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


    reader.readAsDataURL(
      file
    );


    clearStatus();


    updateUploadButton();

  }
);


// =====================================================
// REMOVE PHOTO
// =====================================================

removePhoto.addEventListener(
  'click',
  function () {

    selectedFile =
      null;


    photoInput.value =
      '';


    photoPreview.src =
      '';


    previewContainer.classList.add(
      'hidden'
    );


    updateUploadButton();

  }
);


// =====================================================
// UPDATE UPLOAD BUTTON
// =====================================================

function updateUploadButton() {

  uploadButton.disabled =
    !selectedPhotoType ||
    !selectedProd ||
    !selectedFile;

}


// =====================================================
// UPLOAD
// =====================================================

uploadButton.addEventListener(
  'click',
  async function () {

    if (!selectedPhotoType) {

      showStatus(
        'Pilih Before atau After terlebih dahulu.',
        'error'
      );

      return;

    }


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


    uploadButton.disabled =
      true;


    uploadButton.textContent =
      'MENGOMPRES...';


    showStatus(
      'Sedang menyiapkan foto...',
      'loading'
    );


    try {

      // =================================================
      // KOMPRES FOTO
      // =================================================

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
        'Mengupload ' +
        selectedPhotoType +
        ' - ' +
        formatFileSize(
          compressedFile.size
        ) +
        '...',
        'loading'
      );


      uploadButton.textContent =
        'MENGUPLOAD...';


      // =================================================
      // BASE64
      // =================================================

      const base64 =
        await fileToBase64(
          compressedFile
        );


      // =================================================
      // PAYLOAD
      // =================================================

      const payload = {

        prodCode:
          selectedProd.prodCode,

        photoType:
          selectedPhotoType,

        fileName:
          selectedProd.prodCode +
          '.jpg',

        mimeType:
          'image/jpeg',

        fileData:
          base64

      };


      console.log(
        'Upload payload:',
        {
          prodCode:
            payload.prodCode,

          photoType:
            payload.photoType,

          fileName:
            payload.fileName
        }
      );


      // =================================================
      // SEND KE APPS SCRIPT
      // =================================================

      const response =
        await fetch(
          API_URL,
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'text/plain;charset=utf-8'
            },

            body:
              JSON.stringify(
                payload
              )

          }
        );


      const result =
        await response.json();


      // =================================================
      // CHECK RESPONSE
      // =================================================

      if (!result.success) {

        throw new Error(
          result.message ||
          'Upload gagal.'
        );

      }


      // =================================================
      // SUCCESS
      // =================================================

      showStatus(
        '✓ Foto ' +
        selectedPhotoType +
        ' berhasil disimpan sebagai ' +
        result.fileName,
        'success'
      );


      // =================================================
      // RESET FOTO
      // =================================================

      selectedFile =
        null;


      photoInput.value =
        '';


      photoPreview.src =
        '';


      previewContainer.classList.add(
        'hidden'
      );


    } catch (error) {

      console.error(
        'Upload error:',
        error
      );


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


// =====================================================
// KOMPRES FOTO
//
// Maksimal:
// 1280 x 1280 px
//
// Target:
// 800 KB
//
// Quality:
// 75% → 65% → 55% → 45% → 35%
//
// Jika hasil kompresi lebih besar dari
// file asli, file asli digunakan.
// =====================================================

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
            async function () {

              const MAX_SIZE =
                1280;


              const TARGET_SIZE =
                800 * 1024;


              let width =
                img.width;


              let height =
                img.height;


              // =========================================
              // RESIZE
              // =========================================

              if (
                width > MAX_SIZE ||
                height > MAX_SIZE
              ) {

                if (
                  width > height
                ) {

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


              // =========================================
              // CANVAS
              // =========================================

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


              // =========================================
              // QUALITY LEVEL
              // =========================================

              const qualities = [
                0.75,
                0.65,
                0.55,
                0.45,
                0.35
              ];


              let bestBlob =
                null;


              // =========================================
              // TEST SETIAP QUALITY
              // =========================================

              for (
                const quality of qualities
              ) {

                const blob =
                  await canvasToBlob(
                    canvas,
                    quality
                  );


                console.log(
                  'Quality:',
                  quality,
                  '| Size:',
                  formatFileSize(
                    blob.size
                  )
                );


                if (
                  !bestBlob ||
                  blob.size <
                  bestBlob.size
                ) {

                  bestBlob =
                    blob;

                }


                if (
                  blob.size <=
                  TARGET_SIZE
                ) {

                  bestBlob =
                    blob;

                  break;

                }

              }


              // =========================================
              // JIKA KOMPRESI LEBIH BESAR
              // GUNAKAN FILE ASLI
              // =========================================

              if (
                bestBlob.size >=
                file.size
              ) {

                console.log(
                  'Hasil kompresi lebih besar atau sama.'
                );


                console.log(
                  'Menggunakan file asli.'
                );


                resolve(
                  file
                );


                return;

              }


              // =========================================
              // BUAT FILE KOMPRESI
              // =========================================

              const compressedFile =
                new File(
                  [bestBlob],
                  'photo.jpg',
                  {
                    type:
                      'image/jpeg',

                    lastModified:
                      Date.now()
                  }
                );


              console.log(
                'Original:',
                formatFileSize(
                  file.size
                )
              );


              console.log(
                'Compressed:',
                formatFileSize(
                  compressedFile.size
                )
              );


              resolve(
                compressedFile
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


      reader.readAsDataURL(
        file
      );

    }
  );

}


// =====================================================
// CANVAS → BLOB
// =====================================================

function canvasToBlob(
  canvas,
  quality
) {

  return new Promise(
    function (resolve, reject) {

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


          resolve(
            blob
          );

        },

        'image/jpeg',

        quality
      );

    }
  );

}


// =====================================================
// FILE → BASE64
// =====================================================

function fileToBase64(file) {

  return new Promise(
    function (resolve, reject) {

      const reader =
        new FileReader();


      reader.onload =
        function () {

          const result =
            reader.result;


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


      reader.readAsDataURL(
        file
      );

    }
  );

}


// =====================================================
// FORMAT FILE SIZE
// =====================================================

function formatFileSize(bytes) {

  if (
    bytes < 1024
  ) {

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


// =====================================================
// STATUS
// =====================================================

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

  statusBox.textContent =
    '';


  statusBox.className =
    'status hidden';

}


// =====================================================
// SECURITY
// =====================================================

function escapeHtml(value) {

  return String(
    value || ''
  )

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


// =====================================================
// CLICK DI LUAR DROPDOWN
// =====================================================

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

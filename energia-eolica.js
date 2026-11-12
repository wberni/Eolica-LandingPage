(function () {
  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var counter = document.getElementById('ct');
  var currentSlide = 0;
  var mobileLayout = window.matchMedia('(max-width: 700px)');

  function fitStage() {
    if (mobileLayout.matches) {
      stage.style.transform = 'none';
      return;
    }

    var scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    stage.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
  }

  function showSlide(index, updateHash) {
    currentSlide = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('on', slideIndex === currentSlide);
    });

    counter.textContent =
      String(currentSlide + 1).padStart(2, '0') +
      ' / ' +
      String(slides.length).padStart(2, '0');

    if (updateHash !== false) {
      try {
        history.replaceState(null, '', '#slide-' + (currentSlide + 1));
      } catch (error) {
        console.error('No se pudo actualizar la diapositiva en la URL.', error);
      }
    }

    if (mobileLayout.matches) {
      window.scrollTo(0, 0);
    }
  }

  function slideFromHash() {
    var match = /^#slide-(\d+)$/.exec(location.hash);
    return match ? parseInt(match[1], 10) - 1 : 0;
  }

  window.addEventListener('resize', fitStage);
  window.addEventListener('hashchange', function () {
    showSlide(slideFromHash(), false);
  });
  document.getElementById('prev').addEventListener('click', function () {
    showSlide(currentSlide - 1);
  });
  document.getElementById('next').addEventListener('click', function () {
    showSlide(currentSlide + 1);
  });

  window.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault();
      showSlide(currentSlide + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      showSlide(currentSlide - 1);
    } else if (event.key === 'Home') {
      showSlide(0);
    } else if (event.key === 'End') {
      showSlide(slides.length - 1);
    } else if (event.key === 'f' || event.key === 'F') {
      try {
        document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen();
      } catch (error) {
        console.error('No se pudo cambiar el modo de pantalla completa.', error);
      }
    }
  });

  var touchStartX = null;
  window.addEventListener(
    'touchstart',
    function (event) {
      touchStartX = event.touches[0].clientX;
    },
    { passive: true }
  );
  window.addEventListener(
    'touchend',
    function (event) {
      if (touchStartX === null) return;

      var distance = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(distance) > 50) {
        showSlide(currentSlide + (distance < 0 ? 1 : -1));
      }
      touchStartX = null;
    }
  );

  document.querySelectorAll('.sw').forEach(function (path) {
    var x = Number(path.dataset.x);
    var y = Number(path.dataset.y);
    var width = Number(path.dataset.w);
    var cycles = Number(path.dataset.c);
    var amplitude = Number(path.dataset.a);
    var points = [];

    for (var point = 0; point <= 160; point++) {
      var angle = (point / 160) * cycles * 2 * Math.PI;
      var command = point === 0 ? 'M' : 'L';
      var pointX = (x + (width * point) / 160).toFixed(1);
      var pointY = (y - amplitude * Math.sin(angle)).toFixed(1);
      points.push(command + pointX + ' ' + pointY);
    }

    path.setAttribute('d', points.join(''));
  });

  function paintPhoto(element, url) {
    element.style.backgroundImage = 'url(' + url + ')';
    element.classList.add('has');
  }

  document.querySelectorAll('.ph').forEach(function (element) {
    var storageKey = 'foto-' + element.getAttribute('data-k');

    try {
      var savedPhoto = localStorage.getItem(storageKey);
      if (savedPhoto) paintPhoto(element, savedPhoto);
    } catch (error) {
      console.error('No se pudo leer la foto guardada.', error);
    }

    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    element.appendChild(input);

    element.addEventListener('click', function (event) {
      if (event.target !== input) input.click();
    });

    input.addEventListener('change', function () {
      var file = input.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function () {
        var image = new Image();
        image.onload = function () {
          var canvas = document.createElement('canvas');
          var scale = Math.min(1, 1000 / image.width);
          canvas.width = image.width * scale;
          canvas.height = image.height * scale;
          canvas
            .getContext('2d')
            .drawImage(image, 0, 0, canvas.width, canvas.height);

          var url = canvas.toDataURL('image/jpeg', 0.82);
          paintPhoto(element, url);
          try {
            localStorage.setItem(storageKey, url);
          } catch (error) {
            console.error('No se pudo guardar la foto en este navegador.', error);
          }
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  });

  fitStage();
  showSlide(slideFromHash());
})();

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwQqvRvzsT3KtWRpnRENcUmPU3HroXt1MtCSzvndk0daComypNO4toq1DIdK5h_pyLBdw/exec"; 

// Función que se ejecuta automáticamente cuando el usuario se loguea con Google
function handleCredentialResponse(response) {
  // Decodificar el token JWT que entrega Google para extraer datos del usuario
  const responsePayload = parseJwt(response.credential);
  
  const userEmail = responsePayload.email;
  const googleUserPhoto = responsePayload.picture;
  
  // Ocultar pantalla de login y mostrar la app y el menú inferior
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-main').classList.remove('hidden');
  document.getElementById('app-nav').classList.remove('hidden');

  // Consultar la Google Sheet con el correo real
  fetchAppData(userEmail, googleUserPhoto);
}

// Decodificador seguro de JWT para Google Sign-In
function parseJwt(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

function switchTab(tabName) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
  
  if (tabName === 'home') {
    document.getElementById('view-home').classList.remove('hidden');
  } else if (tabName === 'central') {
    document.getElementById('view-central').classList.remove('hidden');
  } else if (tabName === 'profile') {
    document.getElementById('view-profile').classList.remove('hidden');
  }
}

async function fetchAppData(email, googleUserPhoto) {
  try {
    const response = await fetch(`${WEB_APP_URL}?email=${encodeURIComponent(email)}`);
    const data = await response.json();

    if (data && data.client) {
      updateUI(data.client, data.articles, googleUserPhoto);
    } else {
      alert("No se encontró ningún registro para el correo: " + email);
    }
  } catch (error) {
    console.error("Error al obtener datos:", error);
    alert("Error de conexión con la base de datos.");
  }
}

function updateUI(client, articles, googleUserPhoto) {
  // Home
  document.getElementById('home-greeting').innerText = `¡HOLA, ${client["Nombres"] || "CLIENTE"}!`;

  // Perfil corto (CORREGIDO EL ERROR DE SINTAXIS AQUÍ)
  document.getElementById('profile-name').innerText = `${client["Nombres"] || ""} ${client["Apellidos"] || ""}`;
  document.getElementById('profile-tel').innerText = client["Telefono"] || "-";
  document.getElementById('profile-age').innerText = client["Edad"] || "-";
  document.getElementById('profile-pic').src = googleUserPhoto || "https://via.placeholder.com/80";

  document.getElementById('val-horario').innerText = client["Horario de Preferencia"] || "-";
  document.getElementById('val-dias').innerText = client["Dias"] || "-";
  document.getElementById('val-valoracion').innerText = client["Proxima Valoracion"] || "-";
  document.getElementById('val-pago').innerText = client["Proximo Pago"] || "-";

  // Artículos (Top 3)
  const container = document.getElementById('articles-container');
  container.innerHTML = "";
  if (articles && articles.length > 0) {
    articles.forEach(art => {
      container.innerHTML += `
        <a href="${art.link}" class="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition">
          <img src="${art.foto}" alt="Art" class="w-16 h-16 rounded-lg object-cover">
          <span class="font-medium text-sm text-gray-800">${art.articulo}</span>
        </a>
      `;
    });
  } else {
    container.innerHTML = `<p class="text-center text-gray-400 text-sm">No hay artículos disponibles.</p>`;
  }
}

// Dentro de tu función updateUI o al procesar la respuesta del fetch:
window.appMeasurementsData = data.measurements || [];

// Cuando el usuario haga click en el botón de Medidas:
function loadModule(moduleName) {
  if (moduleName === 'medidas') {
    if (window.initMedidasModule) {
      window.initMedidasModule(window.appMeasurementsData);
    }
  } else {
    console.log(`Cargando módulo: ${moduleName}`);
  }
}



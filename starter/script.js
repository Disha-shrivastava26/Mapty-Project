'use strict';

class Workout {
  date = new Date();
  id = (new Date() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 
  'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);

    this.cadence = cadence;

    this.calcPace();
    this._setDescription();
  }

  //method
  calcPace() {
    this.pace = this.duration / this.distance;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);

    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }

  // method

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

// const run1 = new Running([34, -12], 25, 20.3);
// const cyclying = new Cycling([34, -12], 25, 20.3);
// console.log(run1, cyclying);

// APPLICATION CLASS

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
// we creating a class to structure the workout section

class App {
  //private fields

  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not find the location');
        },
      );
    }
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.#map);
    // var marker = L.marker(coords).addTo(map);

    // we want the coordinates of the when user clicked on the map

    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    // as soon as user clicks on user we wan the form render first with focus on KM
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideform() {
    //prettier-ignore
    inputDistance.value =inputDuration.value =inputCadence.value =inputElevation.value ='';

    form.style.display = 'none';
    form.classList.add('hidden');

    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    e.preventDefault();

    //validate
    const validate = function (...inputs) {
      return inputs.every(inp => Number.isFinite(inp));
    };

    //All positive

    const allPositive = function (...inputs) {
      return inputs.every(inp => inp > 0);
    };

    //get the data from the user
    const type = inputType.value; //running , cycling
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // validate the data
    // Activity-> running ->object create running ka

    if (type === 'running') {
      const cadence = +inputCadence.value;

      //validate the data
      // 1. must be number
      // 2. positive number

      if (
        !validate(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Input must be number and positive');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // activity-> cycling -> object creating cycling ka

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validate(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Input must be number and positive');
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // new object to workout array
    this.#workouts.push(workout);

    console.log(workout);
    // render on the map

    // render on the list

    this._renderWorkout(workout);
    // hide the form
    this._hideform();

    //display marker on enter
    // //console.log(mapEvent);

    this._renderWorkoutMarker(workout);
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }),
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.description}`,
      )
      .openPopup();
  }

  //function for the render the workout on the list
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2> 
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>`;
    }

    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>`;
    }
    // we are attaching as sibling here

    form.insertAdjacentHTML('afterend', html);
  }
}

const app = new App();

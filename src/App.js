/* eslint-disable eqeqeq */

import React, { useEffect, useState } from 'react';

import './App.scss';

import LightOn from './images/light_on.gif';
import LightOff from './images/light_off.gif';

import Spinner from './Spinner';

const CALL_LIMIT = 100;
const TIME_WAITING = 500;
const TIME_DELAY = 1500;
const LIGHTS_DEFAULT = [
  { id: 1, status: false, name: 'field1' },
  { id: 2, status: false, name: 'field2' },
  { id: 3, status: false, name: 'field3' },
  { id: 4, status: false, name: 'field4' },
  { id: 5, status: false, name: 'field5' },
  { id: 6, status: false, name: 'field6' },
  { id: 7, status: false, name: 'field7' },
  { id: 8, status: false, name: 'field8' },
];

const URL_GET_STATUS =
  'https://api.thingspeak.com/channels/1756132/feeds/last.json?api_key=XVYLM1OQEPZR3DF4';
const URL_UPDATE_STATUS =
  'https://api.thingspeak.com/update?api_key=9NNVL4H9TUNM9CJN';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getStatus = async () => {
  return fetch(URL_GET_STATUS)
    .then((response) => response.json())
    .catch((err) => {
      console.log('updateStatus => err => ', err);
      throw new Error(err);
    });
};

const updateStatus = async (query) => {
  return fetch(`${URL_UPDATE_STATUS}${query}`)
    .then((response) => response.json())
    .catch((err) => {
      console.log('updateStatus => err => ', err);
      throw new Error(err);
    });
};

const App = () => {
  const [lights, setLights] = useState(LIGHTS_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState(0);

  // Goi len server lay ve thong tin status cua tat ca cac bong den
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const result = await getStatus();

        let id = 0;
        const newLights = [];

        // Format lai du lieu status bong den
        for (const [key, value] of Object.entries(result)) {
          if (key.startsWith('field')) {
            newLights.push({
              id: ++id,
              status: value == '1' ? false : true,
              name: key,
            });
          }
        }

        // Set status cac bong den
        setLights(newLights);
      } catch (error) {
        console.log('error: ', error);
      }
    };

    fetchStatus();
  }, []);

  const updateLightStatus = async (light, status) => {
    console.log('Run');
    // start loading
    setLoading(true);
    setLoadingId(light.id);

    // Tim kiem va cap nhat tam thoi lai status cua bong den tren web
    const index = lights.findIndex((item) => item.id == light.id);
    const newState = [...lights];
    newState[index] = { ...newState[index], status };

    // format query => &field1=1&field2=0 ...
    const query = newState.reduce((pre, cur) => {
      return pre + `&${cur.name}=${cur.status ? '0' : '1'}`;
    }, '');

    try {
      let count = 1;

      // Cap nhat lai trang thai cua bong den tren server
      let res = await updateStatus(query);

      // Neu ket qua = 0 (loi) => Tiep tuc goi lai de cap nhat cho duoc trang thai bong den tren server
      while (res == '0' && count != CALL_LIMIT) {
        count++;
        await sleep(TIME_WAITING);
        res = await updateStatus(query);
      }

      // Delay khoang thoi gian de dong bo theo server
      await sleep(TIME_DELAY);

      // Chinh thuc cap nhat trang thai bong den do tren web
      setLights(newState);

      // Cancel loading
      setLoading(false);
      setLoadingId(0);
    } catch (error) {
      console.log('error: ', error);
    }
  };

  return (
    <div className='container'>
      <div className='header'>
        <h1 className='title'>Đồ án tốt nghiệp</h1>
        <h2 className='sub-title'>
          <u>Đề tài: </u>Thiết kế và thi công mô hình giám sát hệ thống máy lạnh
        </h2>

        <h3 className='description'>Hệ thống kiểm soát máy lạnh</h3>
      </div>
      <div className='main'>
        <div className='wrapper'>
          {lights.map((item, index) => {
            return (
              <div
                className={`box ${loading ? 'is-disabled' : ''}`}
                key={item.id}
                onClick={() => updateLightStatus(item, !item.status)}
                aria-disabled={loading}
              >
                {loading && loadingId == item.id && (
                  <div className='loading'>
                    <Spinner />
                  </div>
                )}

                {item.status ? (
                  <img className='image' src={LightOn} alt='lightOn' />
                ) : (
                  <img className='image' src={LightOff} alt='lightOff' />
                )}

                <span className='title'>Máy lạnh {index + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default App;

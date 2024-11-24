
// const chai = require('chai');
// const chaiHttp = require('chai-http');
// const { expect } = chai;
// const supertest = require('supertest');

import chaiHttp from 'chai-http';
import supertest from 'supertest';
import * as chai from 'chai';

import { STATES } from '../utils/constants.js';

chai.use(chaiHttp);

const appUrl = 'http://localhost:8199'; // Update this if your app runs on a different host or port

describe('API Endpoint Tests', () => {

    describe('PUT /state', () => {
        it('should set the state to INIT', async () => {
            const res = await supertest(appUrl)
                .put('/state')
                .send({ state: STATES.INIT });
            expect(res.status).to.equal(200);
            expect(res.text).to.include('State updated to INIT');
        });

        it('should set the state to RUNNING', async () => {
            const res = await supertest(appUrl)
                .put('/state')
                .send({ state: STATES.RUNNING });
            expect(res.status).to.equal(200);
            expect(res.text).to.include('State updated to RUNNING');
        });

        it('should not change state if it is already RUNNING', async () => {
            const res = await supertest(appUrl)
                .put('/state')
                .send({ state: STATES.RUNNING });
            expect(res.status).to.equal(200);
            expect(res.text).to.equal('No state change required.');
        });

        it('should set the state to PAUSED', async () => {
            const res = await supertest(appUrl)
                .put('/state')
                .send({ state: STATES.PAUSED });
            expect(res.status).to.equal(200);
            expect(res.text).to.include('State updated to PAUSED');
        });

        it('should return an error for invalid state transitions', async () => {
            const res = await supertest(appUrl)
                .put('/state')
                .send({ state: 'INVALID_STATE' });
            expect(res.status).to.equal(400);
            expect(res.text).to.include('Invalid transition');
        });

        it('should set the state to SHUTDOWN', async () => {
            const res = await supertest(appUrl)
                .put('/state')
                .send({ state: STATES.SHUTDOWN });
            expect(res.status).to.equal(200);
            expect(res.text).to.include('State updated to SHUTDOWN');
        });
    });

});

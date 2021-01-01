import { Injectable } from '@angular/core';
import { Router, UrlSegment } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SongsService {

  constructor(private router: Router, private http: HttpClient) { }
    // SPOTIFY API CALLS
    getTrack(id) {
      console.log('service getTrack called id:'+id)
      return this.http.post(`${environment.apiUrl}/track/getTrack`, id);
    }
    getUSTop50() {
      console.log('getUSTop50 called')
      return this.http.get(`${environment.apiUrl}/spotify/getUSTop50`);
    }

    // REVIEWS API CALLS
    getTrackReviews(id) {
      return this.http.post(`${environment.apiUrl}/reviews/getTrackReviews`, id);
    }

    // RATING API CALLS
    submitRating(request) {
      return this.http.post(`${environment.apiUrl}/reviews/submitRating`, request);
    }

    getUserSongData(userID) {
      console.log('usersongdata called')
      return this.http.post(`${environment.apiUrl}/reviews/getUserSongData`, userID);
    }
}

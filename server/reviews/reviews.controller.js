const express = require('express');
const router = express.Router();
const db = require('../db');

// routes
router.post('/getTrackReviews', getTrackReviews);
router.post('/submitReview', submitReview);
router.post('/submitRating', submitRating);
router.post('/editRating', editRating);
router.post('/getUserSongData', getUserSongData);

module.exports = router;

// server side gets
async function getTrackReviews(req, res, next) {
    let spotifyID = req.body.id;
    // console.log('spotifyID: '+spotifyID)
    const qResult = await db.pool.query(`SELECT * FROM tracks WHERE spotifyid = $1`, [spotifyID])
    if (!qResult.rows[0]) { // If track doesn't exist on db, it has no ratings/reviews
        res.json({ likes: 0, rating: 0, ratings: 0, reviews: 0 })
        
    } else {
        const userReviews = await db.pool.query(`SELECT * FROM songreviews WHERE spotifyid = $1 AND review IS NOT NULL`, [spotifyID])
        const numbers = qResult.rows[0]

        if (userReviews.rows[0]) {
            console.log('USERREVIEWS: '+JSON.stringify(userReviews.rows))
            res.json({ likes: numbers['likes'], rating: numbers['rating'], ratings: numbers['ratings'], reviews: numbers['reviews'], userReviews: userReviews.rows })
        } else{
            res.json({ likes: numbers['likes'], rating: numbers['rating'], ratings: numbers['ratings'], reviews: numbers['reviews'] })
        }
    }
}

async function getUserSongData(req, res, next) {
    let { userID, spotifyID }= req.body;
     console.log('userID: '+userID)
     console.log('spotifyID: '+spotifyID)
    const qResult = await db.pool.query(`SELECT * FROM songreviews WHERE spotifyid = $1 AND userid = $2`, [spotifyID, userID])
    if (!qResult.rows[0]) {
        console.log("USER HAS NOT RATED")
        res.json({ rated: false })
    } else {
        const userRatings = qResult.rows[0]
        console.log('userRatings: '+JSON.stringify(userRatings));
        res.json({ rated: true, rating: userRatings['rating'], review: userRatings['review'], date: userRatings['date'] })
    }
}

// user inputs
async function submitRating(req, res, next) {
    console.log('req.body: '+JSON.stringify(req.body));
    let { userID, username, spotifyID, rating } = req.body;
    let date = new Date().toLocaleDateString();

    console.log(userID, username, spotifyID, rating)
    // Check if user has existing review
    const exists = await db.pool.query(`SELECT * FROM songreviews WHERE userid = $1 AND spotifyid = $2`, [userID, spotifyID])
    if (exists.rows[0]) { // User already has existing review
        console.log("User already submitted rating");
        res.json({ success: false });
    }
    else {
        await db.pool.query(`INSERT INTO songreviews (userid, username, rating, spotifyid, date) VALUES ($1, $2, $3, $4, $5)`, [userID, username, rating, spotifyID, date])

        const ratings = await db.pool.query(`SELECT ratings, totalrating FROM tracks WHERE spotifyid = $1`, [spotifyID])
        if (ratings.rows[0]) { // If track already exists in tracks
            console.log('ratings.rows[0]: '+JSON.stringify(ratings.rows[0]))
            newRatings = ratings.rows[0].ratings + 1
            newTotalRatings = ratings.rows[0].totalrating + rating
            await db.pool.query(`UPDATE tracks SET ratings = ratings + 1, totalrating = totalrating + $1 WHERE spotifyid = $2`, [rating, spotifyID])
            await db.pool.query(`UPDATE tracks SET rating = totalrating/ratings WHERE spotifyid = $1`, [spotifyID])
            
        } else {
            await db.pool.query(`INSERT INTO tracks (spotifyid, rating, reviews, likes, ratings, totalrating) VALUES ($1, $2, $3, $4, $5, $6)`, [spotifyID, rating, 0, 0, 1, rating])
            console.log('ratings.rows[0]: '+ratings.rows[0])
        }
        
        // await db.pool.query(`UPDATE tracks SET totalrating = SUM(totalrating) + SUM($1) WHERE spotifyid = $2`, [rating, spotifyID])
        // await db.pool.query(`UPDATE tracks SET rating = totalrating/ratings`)

        res.json({ success: true });
    }
}

async function editRating(req, res, next) {
    console.log('req.body: '+JSON.stringify(req.body));
    let { userID, username, spotifyID, rating } = req.body;
    let date = new Date().toLocaleDateString();

    console.log(userID, username, spotifyID, rating)
    // Check if user has existing review
    const exists = await db.pool.query(`SELECT * FROM songreviews WHERE userid = $1 AND spotifyid = $2`, [userID, spotifyID])
    if (exists.rows[0]) { // User already has existing review
        //Find out how much to change totalrating
        let diff = rating - exists.rows[0]['rating'] 
        await db.pool.query(`UPDATE songreviews SET rating = $1, date = $2 WHERE userid = $3 AND spotifyid = $4`, [rating, date, userID, spotifyID])
        await db.pool.query(`UPDATE tracks SET totalrating = totalrating + $1 WHERE spotifyid = $2`, [diff, spotifyID])
        await db.pool.query(`UPDATE tracks SET rating = totalrating/ratings WHERE spotifyid = $1`, [spotifyID])
        res.json({ success: true });
    }
    else {
        res.json({ success: false });
    }
}

async function submitReview(req, res, next) { // TODO
    console.log('req.body: '+JSON.stringify(req.body));
    let { userID, username, spotifyID, rating, reviewContent } = req.body
    let date = new Date().toLocaleDateString();

    const exists = await db.pool.query(`SELECT * FROM songreviews WHERE userid = $1 AND spotifyid = $2`, [userID, spotifyID])
    if (exists.rows[0]) { // User already has existing review. Therefore, track is already in tracks table as well so we update that row
        //Find out how much to change totalrating
        let diff = rating - exists.rows[0]['rating'] 
        await db.pool.query(`UPDATE songreviews SET rating = $1, review = $2 WHERE userid = $3 AND spotifyid = $4`, [rating, reviewContent, userID, spotifyID])
        await db.pool.query(`UPDATE tracks SET totalrating = totalrating + $1 WHERE spotifyid = $2`, [diff, spotifyID])
        await db.pool.query(`UPDATE tracks SET rating = totalrating/ratings WHERE spotifyid = $1`, [spotifyID])
        res.json({ success: true });
    }
    else { // User does not have existing review
        //Insert review into songreviews table
        await db.pool.query(`INSERT INTO songreviews (userid, username, rating, spotifyid, date, review) VALUES ($1, $2, $3, $4, $5, $6)`, [userID, username, rating, spotifyID, date, reviewContent])

        // Check if track exists in tracks table
        if (ratings.rows[0]) { // If track already exists in tracks
            console.log('ratings.rows[0]: '+JSON.stringify(ratings.rows[0]))
            newRatings = ratings.rows[0].ratings + 1
            newTotalRatings = ratings.rows[0].totalrating + rating
            await db.pool.query(`UPDATE tracks SET ratings = ratings + 1, totalrating = totalrating + $1 WHERE spotifyid = $2`, [rating, spotifyID])
            await db.pool.query(`UPDATE tracks SET rating = totalrating/ratings WHERE spotifyid = $1`, [spotifyID])
        } 
        else {
            await db.pool.query(`INSERT INTO tracks (spotifyid, rating, reviews, likes, ratings, totalrating) VALUES ($1, $2, $3, $4, $5, $6)`, [spotifyID, rating, 1, 0, 1, rating])
            console.log('ratings.rows[0]: '+ratings.rows[0])
        }
        res.json({ success: true });
    }
}
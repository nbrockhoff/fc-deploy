const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const farmSlug = require('slugs');

const farmSchema = new mongoose.Schema({
	farmName: {
		type: String,
		trim: true,
		required: 'Please enter a farm name.'
	},
	farmSlug: String,
	farmDescription: {
		type: String, 
		trim: true
	},
	farmTags: [String],
	created: {
		type: Date,
		default: Date.now
	},
	farmLocation: {
		type: {
			type: String,
			default: 'Point'
		},
		coordinates:  [{
			type: Number, 
			required: 'You must supply coordinates.'	
		}],
		address: {
			type: String,
			required: 'You must supply an address.'
		}
	},
<<<<<<< HEAD
	farmContact: {
		phone: {
			type: 'String',
			validate: {
          validator: function(v) {
            return /\d{3}-\d{3}-\d{4}/.test(v);
          },
          message: '{VALUE} is not a valid phone number.'
        },
      required: 'User phone number required'
    },
		email: {
			type: 'String',
			validate: {
          validator: function(v) {
            return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(v);
          },
          message: '{VALUE} is not a valid email.'
      }
		},
		website: {
			type: 'String',
			validate: {
          validator: function(v) {
            return /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/.test(v);
          },
          message: '{VALUE} is not a valid website address.'
      }
		}
	},
=======
>>>>>>> 639d046b6fc73103ce9a1f8891222334c8c327ed
	farmPhoto: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

farmSchema.pre('save',async function(next){
	if (!this.isModified('farmName')){
		
		next();
		return;
	}
	this.farmSlug = farmSlug(this.farmName);
	const slugRegEx = new RegExp(`^(${this.farmSlug})((-[0-9]*$)?)$`, 'i');
	const farmsWithSlug = await this.constructor.find({ farmSlug: slugRegEx });
	if(farmsWithSlug.length){
		this.farmSlug = `${this.farmSlug}-${farmsWithSlug.length + 1}`;
	} 

	next();
});

farmSchema.statics.getFarmTagsList = function() {
	return this.aggregate([
		{ $unwind: '$farmTags' },
		{ $group: {
			_id: '$farmTags', count: { $sum: 1 }
			}
		},
		{ $sort: {
			count: -1
			}	
		}
	]);
}

// Define our indexes
farmSchema.index({
  farmName: 'text',
  farmDescription: 'text',
  farmTags: 'text'
});

farmSchema.index({ farmLocation: '2dsphere' });


farmSchema.statics.getTopFarms = function() {
  return this.aggregate([
    // Lookup farms and populate their reviews
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'farm', as: 'reviews' }},
    // filter for only items that have 2 or more reviews
    { $match: { 'reviews.1': { $exists: true } } },
    // Add the average reviews field
    { $project: {
      photo: '$$ROOT.farmPhoto',
      name: '$$ROOT.farmName',
      reviews: '$$ROOT.reviews',
      slug: '$$ROOT.farmSlug',
      averageRating: { $avg: '$reviews.rating' }
    } },
    // sort it by our new field, highest reviews first
    { $sort: { averageRating: -1 }},
    // limit to at most 10
    { $limit: 10 }
  ]);
}

// find reviews where the farms _id property === reviews farm property
farmSchema.virtual('reviews', {
  ref: 'Review', // what model to link?
  localField: '_id', // which field on the farm?
  foreignField: 'farm' // which field on the review?
});

function autopopulate(next) {
  this.populate('reviews');
  next();
}

farmSchema.pre('find', autopopulate);
farmSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Farm', farmSchema);
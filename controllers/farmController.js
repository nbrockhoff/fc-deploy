const mongoose = require('mongoose');
const Farm = mongoose.model('Farm');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
	storage: multer.memoryStorage(),
	fileFilter(req, file, next){
		const isPhoto = file.mimetype.startsWith('image/');
		if(isPhoto){
			next(null, true);
		} else {
			next({ message: 'Please use one of the accepted filetypes listed below.'}, false);
		}
	}
};

exports.homePage = (req, res) => {
	res.render('index');
};

exports.addFarm = (req, res) => {
	res.render('editFarm', { title: 'Add Farm'});
};

exports.upload = multer(multerOptions).single('farmPhoto');

exports.resize = async (req, res, next) => {
	if (!req.file){
		next();
		return;
	}
	const extension = req.file.mimetype.split('/')[1];
	req.body.farmPhoto = `${uuid.v4()}.${extension}`;
	const farmPhoto = await jimp.read(req.file.buffer);
	await farmPhoto.resize(1600, jimp.AUTO);
	await farmPhoto.write(`./public/uploads/${req.body.farmPhoto}`);
	next();
};

exports.createFarm = async (req, res) => {
  req.body.author = req.user._id;
	const farm = await (new Farm(req.body)).save();
	req.flash('success', `Successfully Created ${farm.farmName}. Care to leave a review?`);
	res.redirect(`/farm/${farm.farmSlug}`);
};

exports.getFarms = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 6;
  const skip = (page * limit) - limit;


  // 1. Query the database for a list of all farms
  const farmsPromise = Farm
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  const countPromise = Farm.count();

  const [farms, count] = await Promise.all([farmsPromise, countPromise]);

  const pages = Math.ceil(count / limit);

  if (!farms.length && skip) {
    req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
    res.redirect(`/farms/page/${pages}`);
    return;
  }

  res.render('farms', { title: 'Farms', farms, page, pages, count });


};


exports.getFarmBySlug = async (req, res, next) => {
	const farm = await Farm.findOne({ farmSlug: req.params.farmSlug }).populate('author');
	if (!farm) return next();
	res.render('farm', {title:  `${farm.farmName}`, farm});
}

exports.getFarmsByTag = async (req, res) => {
	const farmTag = req.params.farmTag;
	const farmTagQuery = farmTag || {$exists: true};

	const farmTagsPromise = Farm.getFarmTagsList(); 
	const farmsPromise =  Farm.find({ farmTags: farmTagQuery });
	const [farmTags, farms] = await Promise.all([
			farmTagsPromise,
			farmsPromise
		]); 
	res.render('farmTag', { farmTags, title: "Tags", farmTag, farms});
};



const confirmOwner = (farm, user) => {
  if (!farm.author.equals(user._id)) {
    throw Error('You must own this farm in order to edit it!');
  }
};

exports.editFarm = async (req, res) => {
	const farm = await Farm.findOne({ _id: req.params.id });
	confirmOwner(farm, req.user);
	res.render('editFarm', { title: `Edit ${farm.farmName}`, farm });
};

exports.updateFarm = async (req, res) => {
	req.body.farmLocation.type = 'Point';
	const farm = await Farm.findOneAndUpdate({
		_id: req.params.id }, 
		req.body, 
		{
			new: true, //returns new entry instead of old entry
			runValidators: true
			}).exec();
		req.flash('success', `Successfully updated <strong>${farm.farmName}</strong>! <a href="/farm/${farm.farmSlug}">View Farm</a>`);
		res.redirect(`/farms/${farm._id}/edit`);
	
};


exports.searchFarms = async (req, res) => {
  const farms = await Farm
  // first find farms that match
  .find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' }
  })
  // the sort them
  .sort({
    score: { $meta: 'textScore' }
  })
  // limit to only 5 results
  .limit(5);
  res.json(farms);
};

exports.mapFarms = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    farmLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 100000 // 100km
      }
    }
  };

const farms = await Farm.find(q).select('farmSlug farmName farmDescription farmLocation farmPhoto').limit(10);
  res.json(farms);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.heartFarm = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User
    .findByIdAndUpdate(req.user._id,
      { [operator]: { hearts: req.params.id } },
      { new: true }
    );
  res.json(user);
};

exports.getHearts = async (req, res) => {
  const farms = await Farm.find({
    _id: { $in: req.user.hearts }
  });
  res.render('farms', { title: 'Favorite Farms', farms });
};


exports.getTopFarms = async (req, res) => {
  const farms = await Farm.getTopFarms();
  res.render('topFarms', { farms, title:'Top Farms!'});
}


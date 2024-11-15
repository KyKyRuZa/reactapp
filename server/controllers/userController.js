const ApiError = require('../err/ApiError')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {User} = require('../models/models')


const generateJwt = (id, email, role) =>{
                return jwt.sign({id, email, role},
                        process.env.JWT_SECRET,
                        {expiresIn: '24h'})
}
class UserController{
        async register(req, res, next){
                const {email, password, role} = req.body
                if (!email || !password){
                        return next(ApiError.badRequest('Не задан email или пароль'))
                }
                const candidate = await User.findOne({where: {email}})
                if (candidate){
                        return next(ApiError.badRequest('Пользователь с таким email уже существует'))
                }
                const hashpass = await bcrypt.hash(password, 5)
                const user = await User.create({email, role, password: hashpass })
                const token = generateJwt(user.id, user.email, user.role)
                return res.json({token})

        }
        async login(req, res, next){
                const {email, password} = req.body
                const user = await User.findOne({where: {email}})
                if (!user){
                        return next(ApiError.badRequest('Пользователь с таким email не найден'))
                }
                let comparePassword = await bcrypt.compareSync(password, user.password)
                if (!comparePassword){
                        return next(ApiError.badRequest('Неверный пароль'))
                }
                const token = generateJwt(user.id, user.email, user.role)
                return res.json({token})        

        }
        async check(req, res, next){
                const token = generateJwt(req.user.id, req.user.email, req.user.role)
                return res.json({token})      
        }
        async getProfile(req, res, next) {
                try {
                    const user = await User.findByPk(req.user.id, {
                        attributes: ['id', 'email', 'role', 'createdAt']
                    })
        
                    if (!user) {
                        return next(ApiError.badRequest('User not found'))
                    }
        
                    return res.json({
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        createdAt: user.createdAt
                    })
                } catch (error) {
                    return next(ApiError.internal('Server error'))
                }
            }

}

module.exports = new UserController()
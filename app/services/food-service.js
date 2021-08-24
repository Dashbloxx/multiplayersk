'use strict';
const ServerConfig = require('../configs/server-config');
const Food = require('../models/food');

/**
 * Creation and removal of food
 */
class FoodService {

    constructor(playerStatBoard, boardOccupancyService, nameService, notificationService) {
        this.playerStatBoard = playerStatBoard;
        this.boardOccupancyService = boardOccupancyService;
        this.nameService = nameService;
        this.notificationService = notificationService;
        this.reinitialize();
    }

    // Only use this alongside clearing boardOccupancyService
    reinitialize() {
        this.food = {};
        this.generateDefaultFood();
    }

    consumeAndRespawnFood(playerContainer) {
        let foodToRespawn = 0;
        const foodsConsumed = this.boardOccupancyService.getFoodsConsumed();
        for (const foodConsumed of foodsConsumed) {
            const playerWhoConsumedFood = playerContainer.getPlayer(foodConsumed.playerId);
            const food = this.food[foodConsumed.foodId];
            playerWhoConsumedFood.grow(ServerConfig.FOOD[food.type].GROWTH);
            const points = ServerConfig.FOOD[food.type].POINTS;
            this.playerStatBoard.increaseScore(playerWhoConsumedFood.id, points);
            this.removeFood(foodConsumed.foodId);
            foodToRespawn++;
        }

        this.generateFood(foodToRespawn);
    }

    generateDefaultFood() {
        this.generateFood(ServerConfig.FOOD.DEFAULT_AMOUNT);
    }

    generateFood(amount) {
        for (let i = 0; i < amount; i++) {
            this.generateSingleFood();
        }
    }

    generateSingleFood() {
        const randomUnoccupiedCoordinate = this.boardOccupancyService.getRandomUnoccupiedCoordinate();
        if (!randomUnoccupiedCoordinate) {
            this.notificationService.broadcastNotification('Could not add more food.  No room left.', 'white');
            return;
        }
        const foodId = this.nameService.getFoodId();
        let food;
        if (Math.random() < ServerConfig.FOOD.GOLDEN.SPAWN_RATE) {
            food = new Food(foodId, randomUnoccupiedCoordinate, ServerConfig.FOOD.GOLDEN.TYPE, ServerConfig.FOOD.GOLDEN.COLOR);
        } else if (Math.random() < ServerConfig.FOOD.SUPER.SPAWN_RATE) {
            food = new Food(foodId, randomUnoccupiedCoordinate, ServerConfig.FOOD.SUPER.TYPE, ServerConfig.FOOD.SUPER.COLOR);
        } else {
            food = new Food(foodId, randomUnoccupiedCoordinate, ServerConfig.FOOD.NORMAL.TYPE, ServerConfig.FOOD.NORMAL.COLOR);
        } else {
            food = new Food(foodId, randomUnoccupiedCoordinate, ServerConfig.FOOD.PURPLE.TYPE, ServerConfig.FOOD.PURPLE.COLOR);
        }
        this.food[foodId] = food;
        this.boardOccupancyService.addFoodOccupancy(food.id, food.coordinate);
    }

    getFood() {
        return this.food;
    }

    getFoodAmount() {
        return Object.keys(this.food).length;
    }

    getLastFoodIdSpawned() {
        return this.food[Object.keys(this.food)[Object.keys(this.food).length - 1]].id;
    }

    removeFood(foodId) {
        const foodToRemove = this.food[foodId];
        this.nameService.returnFoodId(foodId);
        this.boardOccupancyService.removeFoodOccupancy(foodId, foodToRemove.coordinate);
        delete this.food[foodId];
    }
}

module.exports = FoodService;

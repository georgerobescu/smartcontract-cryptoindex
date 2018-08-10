const Token = artifacts.require("CryptoIndexToken.sol");

async function assertRevert(promise) {
    try {
        await promise;
        assert.fail('Expected revert not received');
    } catch (error) {
        const revertFound = error.message.search('revert') >= 0;
        const invalidOpcodeFound = error.message.search('invalid opcode') >= 0;
        assert(revertFound || invalidOpcodeFound, `Expected "revert" or "invalid opcode", got ${error} instead`);
    }
};

contract('CryptoIndex Token', function ([_, owner, teamFund, recipient, investor, notInvestor]) {
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    beforeEach(async function () {
        this.token = await Token.new(owner, teamFund, {from: owner});
    });

    describe('total supply', function () {
        it('should have initial total supply 300000000 CIX100', async function () {
            const totalSupply = await this.token.totalSupply();
            assert.equal(totalSupply, 300000000*Math.pow(10,18));
        });

        it('owner should have initial balance 270000000 CIX100', async function () {
            const ownerBalance = await this.token.balanceOf(owner);
            assert.equal(ownerBalance, 270000000*Math.pow(10,18));
        });

        it('team fund should have initial balance 30000000 CIX100', async function () {
            const fundBalance = await this.token.balanceOf(teamFund);
            assert.equal(fundBalance, 30000000*Math.pow(10,18));
        });        
    });

    describe('balanceOf', function () {
        describe('when the requested account has no tokens', function () {
            it('returns zero', async function () {
                const balance = await this.token.balanceOf(notInvestor);
                assert.equal(balance, 0);
            });
        });

        describe('when has some tokens', function() {
            it('is not zero', async function() {
                this.token.transfer(investor, 100, {from: owner});
                const balance = await this.token.balanceOf(investor);
                assert.equal(balance, 100);
            })
        })
    });

    describe('transfer', function () {

        beforeEach('transfer tokens to investor', async function() {
            await this.token.transfer(investor, 100, {from: owner});
        })
            
        describe('when the recipient is not the zero address', function () {
            const to = recipient;
            describe('when the sender does not have enough balance', function () {
                const amount = 101;
                it('reverts', async function () {
                    await assertRevert(this.token.transfer(to, amount, { from: investor }));
                });
            });

        describe('when the sender has enough balance', function () {
            const amount = 100;
            it('transfers the requested amount', async function () {
                await this.token.transfer(to, amount, { from: investor });
                const senderBalance = await this.token.balanceOf(investor);
                assert.equal(senderBalance, 0);
                const recipientBalance = await this.token.balanceOf(to);
                assert.equal(recipientBalance, amount);
            });
        });
    });

    describe('when the recipient is the zero address', function () {
        const to = ZERO_ADDRESS;

        it('reverts', async function () {
            await assertRevert(this.token.transfer(to, 100, { from: investor }));
            });
        });
    
    describe('when the recipient is the token address', function () {
        it('reverts', async function () {
            const to = this.token.address;
            await assertRevert(this.token.transfer(to, 100, { from: investor }));
            });
        });

    });

    describe('approve', function () {
        beforeEach('transfer tokens to investor', async function() {
            await this.token.transfer(investor, 100, {from: owner});
        })

        const spender = recipient;

        describe('when the sender has enough balance', function () {
            const amount = 100;

            describe('when there was no approved amount before', function () {
                it('approves the requested amount', async function () {
                    await this.token.approve(spender, amount, { from: investor });
                    const allowance = await this.token.allowance(investor, spender);
                    assert.equal(allowance, amount);
                });
            });

            describe('when the spender had an approved amount', function () {
                it('reverts', async function () {
                    await this.token.approve(spender, 2, { from: investor });
                    await assertRevert(this.token.approve(spender, 2, {from: investor}));
                });
            });
        });

        describe('when the sender does not have enough balance', function () {
            const amount = 101;
                
            describe('when there was no approved amount before', function () {
                it('approves the requested amount', async function () {
                    await this.token.approve(spender, amount, { from: investor });
                    const allowance = await this.token.allowance(investor, spender);
                    assert.equal(allowance, amount);
                });
            });
        });
    });

    describe('transfer from', function () {
        const spender = investor;

        describe('when the recipient is not the zero address', function () {
            const to = recipient;

            describe('when the spender has enough approved balance', function () {
                beforeEach(async function () {
                    await this.token.transfer(investor, 100, {from: owner});
                    await this.token.approve(spender, 100, { from: investor });
                });

                describe('when the investor has enough balance', function () {
                    const amount = 100;

                    it('transfers the requested amount', async function () {
                        await this.token.transferFrom(investor, to, amount, { from: spender });
                        const senderBalance = await this.token.balanceOf(investor);
                        assert.equal(senderBalance, 0);
                        const recipientBalance = await this.token.balanceOf(to);
                        assert.equal(recipientBalance, amount);
                    });

                    it('decreases the spender allowance', async function () {
                        await this.token.transferFrom(investor, to, amount, { from: spender });
                        const allowance = await this.token.allowance(investor, spender);
                        assert(allowance.eq(0));
                    });
                });

                describe('when the investor does not have enough balance', function () {
                    const amount = 101;
                    it('reverts', async function () {
                        await assertRevert(this.token.transferFrom(investor, to, amount, { from: spender }));
                    });
                });
            });

            describe('when the spender does not have enough approved balance', function () {
                beforeEach(async function () {
                    await this.token.approve(spender, 99, { from: investor });
                });

                describe('when the investor has enough balance', function () {
                    const amount = 100;

                    it('reverts', async function () {
                        await assertRevert(this.token.transferFrom(investor, to, amount, { from: spender }));
                    });
                });

                describe('when the investor does not have enough balance', function () {
                    const amount = 101;

                    it('reverts', async function () {
                        await assertRevert(this.token.transferFrom(owner, to, amount, { from: spender }));
                    });
                });
            });
        });

        describe('when the recipient is the zero address', function () {
            const amount = 100;
            const to = ZERO_ADDRESS;

            beforeEach(async function () {
                await this.token.approve(spender, amount, { from: investor });
            });

            it('reverts', async function () {
                await assertRevert(this.token.transferFrom(investor, to, amount, { from: spender }));
            });
        });

        describe('when the recipient is the contract address', function () {
            const amount = 100;
            
            beforeEach(async function () {
                await this.token.approve(spender, amount, { from: investor });
            });

            it('reverts', async function () {
                const to = this.token.address;
                await assertRevert(this.token.transferFrom(investor, to, amount, { from: spender }));
            });
        });
    });

    describe('burning', function() {
        const ownerBalance = 270000000*1e18;

        it('decreases total supply', async function() {
            await this.token.burnTokens(ownerBalance, {from: owner});
            const totalSupply = await this.token.totalSupply();
            assert.equal(totalSupply, 30000000*Math.pow(10,18));            
            
        });
        
        it('decreases senders balance', async function() {
            await this.token.burnTokens(ownerBalance, {from: owner});
            const balance = await this.token.balanceOf(owner);
            assert.equal(balance, 0);
        });
    });
});